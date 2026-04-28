-- ────────────────────────────────────────────────────────────────
-- 021 — pg_cron schedule p/ supremo-retry worker
--
-- Habilita pg_cron + pg_net e agenda chamada da Edge Function
-- `supremo-retry` a cada 5 minutos.
--
-- Os secrets (URL do projeto + service_role_key) são lidos do
-- supabase_vault (extensão default do Supabase, criptografada at rest).
--
-- ⚠ ANTES de aplicar, seed os secrets no Vault. Use o pattern upsert
-- (vault.create_secret falha em duplicate; use update_secret se já
-- existir):
--
-- DO $$
-- DECLARE existing_id uuid;
-- BEGIN
--   SELECT id INTO existing_id FROM vault.secrets WHERE name='project_url';
--   IF existing_id IS NULL THEN
--     PERFORM vault.create_secret('https://SEU.supabase.co','project_url','URL');
--   ELSE
--     PERFORM vault.update_secret(existing_id,'https://SEU.supabase.co','project_url','URL');
--   END IF;
-- END $$;
--
-- (idem p/ name='service_role_key' com a JWT da Settings → API → service_role)
-- ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função wrapper que dispara a Edge Function via http
-- Lê secrets do vault.decrypted_secrets (view restrita)
CREATE OR REPLACE FUNCTION trigger_supremo_retry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_url  text;
  v_key  text;
  v_resp bigint;
BEGIN
  -- Lê do Vault (decrypted_secrets é a view oficial)
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets
   WHERE name = 'project_url'
   LIMIT 1;

  SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
   WHERE name = 'service_role_key'
   LIMIT 1;

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING
      'supremo-retry: vault não tem ''project_url'' ou ''service_role_key''. '
      'Rode no SQL Editor: '
      'SELECT vault.create_secret(''https://...supabase.co'', ''project_url''); '
      'SELECT vault.create_secret(''eyJ...'', ''service_role_key'');';
    RETURN;
  END IF;

  SELECT net.http_post(
    url := v_url || '/functions/v1/supremo-retry',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object('batch_size', 20),
    timeout_milliseconds := 30000
  ) INTO v_resp;
END;
$$;

-- Schedule a cada 5min — idempotente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'supremo-retry-every-5min') THEN
    PERFORM cron.unschedule('supremo-retry-every-5min');
  END IF;
END $$;

SELECT cron.schedule(
  'supremo-retry-every-5min',
  '*/5 * * * *',
  $$ SELECT trigger_supremo_retry(); $$
);

COMMENT ON FUNCTION trigger_supremo_retry IS
  'Wrapper plpgsql para pg_cron disparar a edge function supremo-retry. '
  'Lê secrets do supabase_vault (vault.decrypted_secrets).';
