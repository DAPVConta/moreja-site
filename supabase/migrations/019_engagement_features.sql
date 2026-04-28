-- ────────────────────────────────────────────────────────────────
-- 019 — Features de engajamento e conversão
--
-- Tabelas que sustentam features das pesquisas de portais modernos:
--   • favorites             — usuário salvar imóvel
--   • saved_searches        — busca salva com alertas WhatsApp/email
--   • property_price_history — timeline de mudança de preço
--   • lancamentos_waitlist  — opt-in "Pré-Lançamento"
--   • valuation_requests    — wizard "Avalie seu imóvel"
--   • neighborhood_guides   — páginas editoriais de bairro (SEO moat)
-- ────────────────────────────────────────────────────────────────

-- =====================
-- favorites
-- =====================
CREATE TABLE IF NOT EXISTS favorites (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id text NOT NULL,
  property_title text,
  property_url   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_idx
  ON favorites (user_id, created_at DESC);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_read_favorites"
  ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "self_write_favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================
-- saved_searches
-- =====================
CREATE TABLE IF NOT EXISTS saved_searches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Permite "anônimo": só email + filtros
  email           text,
  name            text,
  filters         jsonb NOT NULL,         -- {finalidade, tipo, bairro, preco_min, preco_max, quartos, ...}
  alert_email     boolean DEFAULT true,
  alert_whatsapp  boolean DEFAULT false,
  alert_phone     text,
  last_notified_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS saved_searches_user_idx
  ON saved_searches (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS saved_searches_email_idx
  ON saved_searches (email) WHERE email IS NOT NULL;

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_read_saved_searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "self_write_saved_searches"
  ON saved_searches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "service_role_write_saved_searches"
  ON saved_searches FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "admin_read_saved_searches"
  ON saved_searches FOR SELECT USING (is_admin());

-- =====================
-- property_price_history
-- =====================
CREATE TABLE IF NOT EXISTS property_price_history (
  id          bigserial PRIMARY KEY,
  property_id text NOT NULL,
  price       numeric(15,2),
  finalidade  text,                       -- 'venda' | 'aluguel'
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, finalidade, recorded_at)
);

CREATE INDEX IF NOT EXISTS property_price_history_idx
  ON property_price_history (property_id, recorded_at DESC);

ALTER TABLE property_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_price_history"
  ON property_price_history FOR SELECT USING (true);
CREATE POLICY "service_role_write_price_history"
  ON property_price_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================
-- lancamentos_waitlist
-- =====================
CREATE TABLE IF NOT EXISTS lancamentos_waitlist (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  phone        text,
  name         text,
  lancamento_id text,                     -- opcional: específico ou geral
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  consent_lgpd boolean DEFAULT false,
  notified_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, lancamento_id)
);

ALTER TABLE lancamentos_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_write_waitlist"
  ON lancamentos_waitlist FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "admin_read_waitlist"
  ON lancamentos_waitlist FOR SELECT USING (is_admin());

-- =====================
-- valuation_requests
-- =====================
CREATE TABLE IF NOT EXISTS valuation_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  email             text NOT NULL,
  phone             text,
  tipo              text,
  finalidade        text,
  bairro            text,
  cidade            text,
  area_total        numeric,
  dormitorios       int,
  banheiros         int,
  vagas             int,
  estimated_value   numeric,
  status            text DEFAULT 'new'
    CHECK (status IN ('new','contacted','scheduled','done','rejected')),
  notes             text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  consent_lgpd      boolean DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS valuation_requests_status_idx
  ON valuation_requests (status, created_at DESC);

ALTER TABLE valuation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_write_valuation"
  ON valuation_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "admin_all_valuation"
  ON valuation_requests FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS valuation_requests_set_updated_at ON valuation_requests;
CREATE TRIGGER valuation_requests_set_updated_at
  BEFORE UPDATE ON valuation_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================
-- neighborhood_guides — landing pages editoriais (SEO)
-- =====================
CREATE TABLE IF NOT EXISTS neighborhood_guides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  city_slug       text NOT NULL,
  name            text NOT NULL,
  intro           text,                   -- ~300 palavras editorial
  hero_image      text,
  highlights      jsonb,                  -- [{label, value}] (preço m², walk score, etc)
  schools         jsonb,
  transit         jsonb,
  meta_title      text,
  meta_description text,
  og_image        text,
  status          text DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  position        int DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neighborhood_guides_status_idx
  ON neighborhood_guides (status, position) WHERE status = 'published';

ALTER TABLE neighborhood_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_neighborhood_guides"
  ON neighborhood_guides FOR SELECT USING (status = 'published');
CREATE POLICY "admin_all_neighborhood_guides"
  ON neighborhood_guides FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS neighborhood_guides_set_updated_at ON neighborhood_guides;
CREATE TRIGGER neighborhood_guides_set_updated_at
  BEFORE UPDATE ON neighborhood_guides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
