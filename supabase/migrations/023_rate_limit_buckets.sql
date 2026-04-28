-- ────────────────────────────────────────────────────────────────
-- 023 — Persistent rate limit buckets
--
-- Substitui o Map em memória das edge functions (que reseta no cold start
-- do Supabase Edge — defesa fraca pra rate limit). Esta tabela persiste
-- buckets por IP+resource e é lida/escrita por todas as functions.
--
-- Schema simples: rolling window de 60s. Cleanup automático via index parcial.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  ip          text NOT NULL,
  resource    text NOT NULL,                 -- 'supremo-proxy', 'send-lead', 'meta-capi', etc
  count       int NOT NULL DEFAULT 1,
  reset_at    timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ip, resource)
);

CREATE INDEX IF NOT EXISTS rate_limit_reset_idx
  ON rate_limit_buckets (reset_at);

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_rate_limit"
  ON rate_limit_buckets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Cleanup function — chamada pelo cron a cada hora p/ remover buckets expirados
CREATE OR REPLACE FUNCTION cleanup_rate_limit_buckets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limit_buckets WHERE reset_at < now();
END;
$$;

-- Schedule via pg_cron (já habilitado no 021)
SELECT cron.unschedule('rate-limit-cleanup-hourly')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'rate-limit-cleanup-hourly'
  );
SELECT cron.schedule(
  'rate-limit-cleanup-hourly',
  '0 * * * *',
  $$ SELECT cleanup_rate_limit_buckets(); $$
);

COMMENT ON TABLE rate_limit_buckets IS
  'Buckets persistentes de rate limit (rolling window). Substitui o Map '
  'em memória das edge functions. Service-role only. Cleanup hourly via cron.';

-- ────────────────────────────────────────────────────────────────
-- Audit log retention (90 dias)
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_audit_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM audit_log WHERE created_at < now() - INTERVAL '90 days';
END;
$$;

SELECT cron.unschedule('audit-log-retention-daily')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'audit-log-retention-daily'
  );
SELECT cron.schedule(
  'audit-log-retention-daily',
  '0 3 * * *',
  $$ SELECT cleanup_audit_log(); $$
);
