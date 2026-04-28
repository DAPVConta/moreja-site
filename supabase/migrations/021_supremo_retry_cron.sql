-- ────────────────────────────────────────────────────────────────
-- 021 — pg_cron schedule p/ supremo-retry worker
--
-- Habilita as extensões pg_cron + pg_net (já vêm no Supabase Pro+) e
-- agenda chamada da Edge Function `supremo-retry` a cada 5 minutos.
--
-- A função lê leads com supremo_status IN ('pending','retry') e tenta
-- POSTar no Supremo. Após 5 tentativas, marca 'failed' e desiste.
--
-- IMPORTANTE: você precisa preencher os GUCs antes de aplicar:
--
--   ALTER DATABASE postgres SET app.settings.supabase_url       = 'https://yxlepgmlhcnqhwshymup.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key   = 'eyJ...';   -- ⚠ mantenha em segredo
--   SELECT pg_reload_conf();
--
-- (ou usar Supabase Dashboard → Database → Cron Jobs UI, que já injeta
--  esses settings automaticamente.)
-- ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove qualquer agendamento antigo com esse nome (idempotente)
SELECT cron.unschedule('supremo-retry-every-5min')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'supremo-retry-every-5min'
  );

-- Função wrapper que dispara a Edge Function via http
CREATE OR REPLACE FUNCTION trigger_supremo_retry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url  text := current_setting('app.settings.supabase_url', true);
  v_key  text := current_setting('app.settings.service_role_key', true);
  v_resp bigint;
BEGIN
  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'supremo-retry: missing app.settings.supabase_url or service_role_key';
    RETURN;
  END IF;

  -- Net.http_post é assíncrono (retorna request id)
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

-- Schedule a cada 5min
SELECT cron.schedule(
  'supremo-retry-every-5min',
  '*/5 * * * *',
  $$ SELECT trigger_supremo_retry(); $$
);

COMMENT ON FUNCTION trigger_supremo_retry IS
  'Wrapper plpgsql para pg_cron disparar a edge function supremo-retry. '
  'Lê GUCs app.settings.supabase_url e app.settings.service_role_key.';
