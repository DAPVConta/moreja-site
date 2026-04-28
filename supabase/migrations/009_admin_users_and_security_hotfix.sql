-- ────────────────────────────────────────────────────────────────
-- 009 — Admin users + roles + security hotfix
--
-- Fixes 3 critical issues identified in the security audit:
--
-- 1. is_admin() previously read auth.jwt().user_metadata.role, which is
--    self-editable by any authenticated user via supabase.auth.updateUser.
--    Any signed-up user could promote themselves to admin and bypass RLS
--    on every CMS table. Now is_admin() queries the admin_users table,
--    which is writable only by service_role.
--
-- 2. leads had a public INSERT policy (public_insert_leads WITH CHECK true)
--    allowing anonymous flooding/scraping straight from the anon key.
--    The send-lead edge function (service_role) is the only legitimate
--    write path; we drop the public policy.
--
-- 3. Adds basic CHECK constraints on leads to limit input size.
-- ────────────────────────────────────────────────────────────────

-- =====================
-- admin_users table
-- =====================
CREATE TABLE IF NOT EXISTS admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'admin'
             CHECK (role IN ('owner','admin','editor','viewer')),
  full_name  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS admin_users_role_idx ON admin_users (role);

-- Service-role is the only writer. Owners can read the full list (for the
-- "Admin users" admin page). Other roles read only their own row.
CREATE POLICY "service_role_write_admin_users"
  ON admin_users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "owners_read_admin_users"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.user_id = auth.uid() AND a.role = 'owner'
    )
  );

CREATE POLICY "self_read_admin_users"
  ON admin_users FOR SELECT
  USING (user_id = auth.uid());

-- =====================
-- Migrate existing admins from user_metadata
-- (best-effort: any existing user with user_metadata.role = 'admin' becomes
--  an owner so they don't lose access at the moment is_admin() is rewritten)
-- =====================
INSERT INTO admin_users (user_id, role)
SELECT id, 'owner'
FROM auth.users
WHERE (raw_user_meta_data ->> 'role') = 'admin'
   OR (raw_app_meta_data ->> 'role') = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- =====================
-- Rewrite is_admin() to read from admin_users
-- Editor and above are considered "admin" for write policies in RLS;
-- viewer is read-only (used by future per-table SELECT policies).
-- =====================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = auth.uid()
      AND role IN ('owner','admin','editor')
  );
$$;

-- Optional helper for finer-grained checks in future migrations
CREATE OR REPLACE FUNCTION admin_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =====================
-- Drop the wide-open public INSERT policy on leads
-- The send-lead edge function uses service_role and bypasses RLS.
-- =====================
DROP POLICY IF EXISTS "public_insert_leads" ON leads;

-- Keep admin_all_leads for dashboard reads/updates.
-- Add a service_role write policy so the edge function can keep inserting.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'service_role_write_leads'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "service_role_write_leads"
        ON leads FOR ALL
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role')
    $POLICY$;
  END IF;
END $$;

-- =====================
-- Basic input-size CHECK constraints on leads
-- (defence in depth — the edge function already sanitizes/truncates,
--  but RLS-bypassing service_role mistakes are still possible)
-- =====================
ALTER TABLE leads
  ADD CONSTRAINT leads_name_length CHECK (length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT leads_email_length CHECK (length(email) BETWEEN 3 AND 320),
  ADD CONSTRAINT leads_phone_length CHECK (phone IS NULL OR length(phone) <= 40),
  ADD CONSTRAINT leads_message_length CHECK (message IS NULL OR length(message) <= 5000),
  ADD CONSTRAINT leads_email_format
    CHECK (email ~* '^[^[:space:]]+@[^[:space:]]+\.[^[:space:]]+$');

COMMENT ON TABLE admin_users IS
  'Authoritative source for admin role membership. Replaces the previous '
  'is_admin() implementation that read user_metadata (user-editable). '
  'Only service_role can write here.';
