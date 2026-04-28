-- ────────────────────────────────────────────────────────────────
-- 016 — Pages: status (draft/published/archived) + histórico de revisões
--
-- Substitui o `published boolean` atual por `status` enum-like.
-- Mantém a coluna antiga durante a transição para não quebrar o site.
-- Adiciona `page_revisions` para histórico de versões.
-- ────────────────────────────────────────────────────────────────

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS status text
    DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived'));

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Migrar dados existentes: se published=true → status='published'
UPDATE pages
   SET status       = CASE WHEN published THEN 'published' ELSE 'draft' END,
       published_at = CASE WHEN published THEN coalesce(published_at, created_at, now()) END
 WHERE status IS NULL OR (status = 'draft' AND published = true);

CREATE INDEX IF NOT EXISTS pages_status_idx ON pages (status);
CREATE INDEX IF NOT EXISTS pages_published_idx ON pages (status, published_at DESC)
  WHERE status = 'published';

-- Atualizar a RLS de leitura pública para aceitar status='published'
-- (mantém a antiga ativa como fallback durante transição)
DROP POLICY IF EXISTS "public_read_published_pages" ON pages;
CREATE POLICY "public_read_published_pages"
  ON pages FOR SELECT
  USING (status = 'published' OR published = true);

-- =====================
-- page_revisions
-- =====================
CREATE TABLE IF NOT EXISTS page_revisions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  content     jsonb,
  meta        jsonb,             -- title, meta_title, meta_description, og_image, etc
  status      text,
  author_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_revisions_page_idx
  ON page_revisions (page_id, created_at DESC);

ALTER TABLE page_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_page_revisions" ON page_revisions;
CREATE POLICY "admin_all_page_revisions"
  ON page_revisions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "service_role_write_page_revisions" ON page_revisions;
CREATE POLICY "service_role_write_page_revisions"
  ON page_revisions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger: snapshot automático em INSERT/UPDATE de pages
CREATE OR REPLACE FUNCTION snapshot_page_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO page_revisions (
    page_id, content, meta, status, author_id, author_email
  ) VALUES (
    NEW.id,
    NEW.content,
    jsonb_build_object(
      'title',            NEW.title,
      'meta_title',       NEW.meta_title,
      'meta_description', NEW.meta_description,
      'og_image',         NEW.og_image,
      'og_description',   NEW.og_description,
      'canonical_url',    NEW.canonical_url
    ),
    NEW.status,
    auth.uid(),
    coalesce(nullif((auth.jwt() ->> 'email'), ''), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pages_snapshot_revision ON pages;
CREATE TRIGGER pages_snapshot_revision
  AFTER INSERT OR UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION snapshot_page_revision();
