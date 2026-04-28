-- ────────────────────────────────────────────────────────────────
-- 018 — Leads: enriquecimento UTM + sincronização com SupremoCRM
--
-- Adiciona colunas para:
--   • UTM tracking (utm_source/medium/campaign/content/term, gclid, fbclid)
--   • contexto da página (referrer, page_url, user_agent, ip_hash)
--   • consentimento LGPD
--   • sincronização com Supremo (id, status, attempts, last_error)
--   • broker assignment
--
-- Habilita o Bloco 7 (push de leads pro Supremo com retry queue).
-- ────────────────────────────────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS utm_source       text,
  ADD COLUMN IF NOT EXISTS utm_medium       text,
  ADD COLUMN IF NOT EXISTS utm_campaign     text,
  ADD COLUMN IF NOT EXISTS utm_content      text,
  ADD COLUMN IF NOT EXISTS utm_term         text,
  ADD COLUMN IF NOT EXISTS gclid            text,
  ADD COLUMN IF NOT EXISTS fbclid           text,
  ADD COLUMN IF NOT EXISTS referrer         text,
  ADD COLUMN IF NOT EXISTS page_url         text,
  ADD COLUMN IF NOT EXISTS user_agent       text,
  ADD COLUMN IF NOT EXISTS ip_hash          text,
  ADD COLUMN IF NOT EXISTS consent_lgpd     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS broker_id        uuid REFERENCES brokers(id) ON DELETE SET NULL,

  -- Sincronização com Supremo
  ADD COLUMN IF NOT EXISTS supremo_id       text,
  ADD COLUMN IF NOT EXISTS supremo_status   text DEFAULT 'pending'
    CHECK (supremo_status IN ('pending','synced','retry','failed','skipped')),
  ADD COLUMN IF NOT EXISTS supremo_attempts int  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supremo_last_error text,
  ADD COLUMN IF NOT EXISTS supremo_synced_at timestamptz,

  -- Tracking events (CAPI dedup, GA4 client_id)
  ADD COLUMN IF NOT EXISTS event_id         text,
  ADD COLUMN IF NOT EXISTS ga_client_id     text,
  ADD COLUMN IF NOT EXISTS fbp              text,
  ADD COLUMN IF NOT EXISTS fbc              text;

-- Índices para a fila de retry e dashboards
CREATE INDEX IF NOT EXISTS leads_supremo_retry_idx
  ON leads (supremo_status, created_at)
  WHERE supremo_status IN ('pending','retry');

CREATE INDEX IF NOT EXISTS leads_status_created_idx
  ON leads (status, created_at DESC);

CREATE INDEX IF NOT EXISTS leads_email_idx
  ON leads (email);

CREATE INDEX IF NOT EXISTS leads_utm_source_idx
  ON leads (utm_source) WHERE utm_source IS NOT NULL;

COMMENT ON COLUMN leads.supremo_status IS
  'pending  — ainda não sincronizado | '
  'synced   — POST /oportunidades retornou 2xx | '
  'retry    — falhou, aguarda próxima tentativa | '
  'failed   — esgotou tentativas (5) | '
  'skipped  — ignorado intencionalmente';
