-- ────────────────────────────────────────────────────────────────
-- 012 — Tracking & Analytics: GA4, Clarity, Hotjar, CAPI, slots
--
-- Adiciona keys em site_config (GA4 standalone, Microsoft Clarity,
-- Hotjar, Meta Conversion API token, default OG template, consent mode)
-- + tabela `tracking_scripts` para slots arbitrários (head/body_start/
-- body_end), permitindo o admin colar qualquer script.
-- ────────────────────────────────────────────────────────────────

INSERT INTO site_config (key, value) VALUES
  -- Google Analytics 4 (separado de GTM)
  ('ga4_measurement_id',        '""'),
  ('ga4_api_secret',            '""'),  -- para Measurement Protocol server-side

  -- Microsoft Clarity (heatmaps/recordings)
  ('clarity_id',                '""'),

  -- Hotjar
  ('hotjar_id',                 '""'),
  ('hotjar_version',            '"6"'),

  -- Meta Conversion API (server-side)
  ('meta_capi_access_token',    '""'),
  ('meta_capi_test_event_code', '""'),

  -- Default OG image template (URL para next/og ImageResponse base)
  ('default_og_template',       '""'),

  -- Consent Mode v2 (LGPD)
  ('consent_mode_enabled',      'true'),
  ('consent_default_state',     '"denied"'),  -- denied | granted

  -- Cookiebot / OneTrust (opcional)
  ('cookiebot_id',              '""'),

  -- LinkedIn Insight Tag partner ID (já existe? garantir presença)
  ('linkedin_partner_id',       '""'),

  -- TikTok Pixel (já existe? garantir presença)
  ('tiktok_pixel_id',           '""'),

  -- Pinterest Tag
  ('pinterest_tag_id',          '""'),

  -- Bing UET (Microsoft Ads)
  ('bing_uet_id',               '""')
ON CONFLICT (key) DO NOTHING;

-- =====================
-- tracking_scripts — slots arbitrários
-- =====================
CREATE TABLE IF NOT EXISTS tracking_scripts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  placement   text NOT NULL CHECK (placement IN ('head','body_start','body_end')),
  code        text NOT NULL,
  position    int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tracking_scripts_active_idx
  ON tracking_scripts (active, placement, position)
  WHERE active = true;

ALTER TABLE tracking_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_tracking_scripts" ON tracking_scripts;
CREATE POLICY "public_read_active_tracking_scripts"
  ON tracking_scripts FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "admin_all_tracking_scripts" ON tracking_scripts;
CREATE POLICY "admin_all_tracking_scripts"
  ON tracking_scripts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tracking_scripts_set_updated_at ON tracking_scripts;
CREATE TRIGGER tracking_scripts_set_updated_at
  BEFORE UPDATE ON tracking_scripts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE tracking_scripts IS
  'Slots para o admin colar scripts arbitrários (chat, A/B test, '
  'pixels custom). Renderizados conforme `placement`: head | '
  'body_start | body_end. Apenas active=true são exibidos.';
