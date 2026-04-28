-- ════════════════════════════════════════════════════════════════
-- EXECUTE_BLOCK_2.sql — Cole TODO este arquivo no Supabase SQL Editor
--
-- Inclui as migrations 021..024 (Blocos 7 e 9).
--
-- ⚠ ATENÇÃO: A migration 021 ATIVA pg_cron e usa GUCs.
-- ANTES de rodar, defina os settings (rode separado primeiro):
--
--   ALTER DATABASE postgres SET app.settings.supabase_url
--     = 'https://yxlepgmlhcnqhwshymup.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key
--     = 'COLE_SEU_SERVICE_ROLE_AQUI';
--   SELECT pg_reload_conf();
--
-- Depois cole este arquivo inteiro.
-- 100% IDEMPOTENTE — pode rodar quantas vezes quiser.
-- ════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════
-- 021_supremo_retry_cron.sql
-- ════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════
-- 022_blog_posts.sql
-- ════════════════════════════════════════════════════════════════
-- ────────────────────────────────────────────────────────────────
-- 022 — Blog posts (RE/MAX-inspired editorial content)
--
-- Tabela `posts` para blog/notícias do mercado imobiliário (SEO long-tail).
-- Reaproveita o padrão de pages.status (draft/published/archived) e adiciona
-- categorias + cover image + excerpt.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  title         text NOT NULL,
  excerpt       text,
  content       text,                          -- markdown ou HTML sanitizado
  cover_image   text,
  category      text,                          -- 'mercado','dicas','financiamento',...
  author_name   text,
  author_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','published','archived')),
  published_at  timestamptz,
  meta_title    text,
  meta_description text,
  og_image      text,
  read_minutes  int,                           -- estimativa de leitura
  views         int NOT NULL DEFAULT 0,
  position      int DEFAULT 0,                 -- p/ override de ordenação
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_published_idx
  ON posts (status, published_at DESC) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS posts_category_idx
  ON posts (category, published_at DESC) WHERE status = 'published';

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_posts" ON posts;
CREATE POLICY "public_read_published_posts"
  ON posts FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "admin_all_posts" ON posts;
CREATE POLICY "admin_all_posts"
  ON posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS posts_set_updated_at ON posts;
CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Anexa audit_trigger (criada na 010)
DROP TRIGGER IF EXISTS audit_posts ON posts;
CREATE TRIGGER audit_posts
  AFTER INSERT OR UPDATE OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

COMMENT ON TABLE posts IS
  'Blog/editorial — alimenta /blog e BlogPreview na home. SEO long-tail.';

-- ════════════════════════════════════════════════════════════════
-- 023_rate_limit_buckets.sql
-- ════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════
-- 024_turnstile_keys.sql
-- ════════════════════════════════════════════════════════════════
-- ────────────────────────────────────────────────────────────────
-- 024 — Cloudflare Turnstile keys
--
-- Turnstile é o CAPTCHA invisível da Cloudflare (substitui o reCAPTCHA).
-- Free, sem PII para Google, sem fricção UX (challenge invisível na maioria
-- dos casos). Plugado em ContactForm, LeadFormInline e ValuationWizard.
--
-- Setup:
--   1. dash.cloudflare.com → Turnstile → Add site
--   2. Domain: moreja.com.br + preview-*.vercel.app
--   3. Copie Site Key (público) e Secret Key (server-only)
--   4. Configure aqui via admin (Configurações → segurança)
-- ────────────────────────────────────────────────────────────────

INSERT INTO site_config (key, value) VALUES
  ('turnstile_site_key',    '""'),  -- exposto ao browser (NEXT_PUBLIC ok)
  ('turnstile_secret_key',  '""')   -- ⚠ server-only, nunca expor — view sanitizada já filtra
ON CONFLICT (key) DO NOTHING;

COMMENT ON COLUMN site_config.value IS
  'JSON value. Para Turnstile: "site_key" público, "secret_key" SERVER-ONLY '
  '(view public_site_config já filtra secret_key da projeção pública).';
