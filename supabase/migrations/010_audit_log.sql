-- ────────────────────────────────────────────────────────────────
-- 010 — Audit log (quem mudou o quê, quando)
--
-- Cria tabela genérica `audit_log` + função `audit_trigger()` que
-- loga INSERT/UPDATE/DELETE em todas as tabelas críticas do CMS.
-- Habilita o "audit log viewer" no admin (Bloco 8).
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id           bigserial PRIMARY KEY,
  actor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email  text,
  actor_role   text,
  table_name   text NOT NULL,
  record_id    text,
  action       text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  diff         jsonb,
  ip           text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_table_idx     ON audit_log (table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx     ON audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_record_idx    ON audit_log (table_name, record_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_audit_log" ON audit_log;
CREATE POLICY "admin_read_audit_log"
  ON audit_log FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "service_role_write_audit_log" ON audit_log;
CREATE POLICY "service_role_write_audit_log"
  ON audit_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger genérico de auditoria
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_diff      jsonb;
  v_record_id text;
  v_email     text;
BEGIN
  v_email := coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    nullif((auth.jwt() ->> 'email'), '')
  );

  IF TG_OP = 'INSERT' THEN
    v_diff := to_jsonb(NEW);
    v_record_id := to_jsonb(NEW) ->> 'id';
  ELSIF TG_OP = 'UPDATE' THEN
    v_diff := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    v_record_id := to_jsonb(NEW) ->> 'id';
  ELSIF TG_OP = 'DELETE' THEN
    v_diff := to_jsonb(OLD);
    v_record_id := to_jsonb(OLD) ->> 'id';
  END IF;

  INSERT INTO audit_log (actor_id, actor_email, actor_role, table_name, record_id, action, diff)
  VALUES (auth.uid(), v_email, admin_role(), TG_TABLE_NAME, v_record_id, TG_OP, v_diff);

  RETURN coalesce(NEW, OLD);
END;
$$;

-- Anexa trigger nas tabelas críticas (idempotente via DROP + CREATE)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'site_config','pages','banners','testimonials','brokers',
    'home_sections','neighborhoods','site_stats','admin_users','leads'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION audit_trigger()',
      t, t
    );
  END LOOP;
END $$;

COMMENT ON TABLE audit_log IS
  'Log imutável de mudanças nas tabelas CMS. Apenas admin pode ler; '
  'apenas service_role pode escrever (via trigger SECURITY DEFINER).';
