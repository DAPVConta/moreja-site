-- ────────────────────────────────────────────────────────────────
-- 020 — RLS tightening + index pass
--
-- Fecha as últimas brechas que o audit de segurança apontou:
--   • properties_cache: só linhas não-expiradas, view sanitizada
--   • site_config: view pública só com keys "safe"
--   • indexes parciais para tabelas mais lidas
-- ────────────────────────────────────────────────────────────────

-- =====================
-- properties_cache — restringir leitura a linhas não-expiradas
-- =====================
DROP POLICY IF EXISTS "public_read_cache" ON properties_cache;
DROP POLICY IF EXISTS "public_read_active_cache" ON properties_cache;
CREATE POLICY "public_read_active_cache"
  ON properties_cache FOR SELECT
  USING (expires_at IS NULL OR expires_at > now());

-- =====================
-- site_config — projeção pública sem tokens/keys sensíveis
-- =====================
CREATE OR REPLACE VIEW public_site_config AS
  SELECT key, value
    FROM site_config
   WHERE key NOT IN (
     -- Tokens / secrets que NÃO devem vazar pro browser
     'meta_capi_access_token',
     'meta_capi_test_event_code',
     'ga4_api_secret',
     'supremo_jwt',
     'sendgrid_api_key',
     'resend_api_key',
     'twilio_auth_token',
     'whatsapp_api_token',
     'turnstile_secret_key',
     'recaptcha_secret_key',
     'webhook_signing_secret'
   );

-- A view não precisa de RLS própria; herda da tabela. Mas garantimos
-- que SELECT na tabela bruta exige admin para keys sensíveis.
DROP POLICY IF EXISTS "public_read_site_config" ON site_config;
DROP POLICY IF EXISTS "public_read_safe_site_config" ON site_config;
CREATE POLICY "public_read_safe_site_config"
  ON site_config FOR SELECT
  USING (
    is_admin()
    OR key NOT IN (
      'meta_capi_access_token',
      'meta_capi_test_event_code',
      'ga4_api_secret',
      'supremo_jwt',
      'sendgrid_api_key',
      'resend_api_key',
      'twilio_auth_token',
      'whatsapp_api_token',
      'turnstile_secret_key',
      'recaptcha_secret_key',
      'webhook_signing_secret'
    )
  );

GRANT SELECT ON public_site_config TO anon, authenticated;

-- =====================
-- Indexes parciais nas tabelas mais lidas
-- =====================
CREATE INDEX IF NOT EXISTS banners_active_position_idx
  ON banners (page, position) WHERE active = true;

CREATE INDEX IF NOT EXISTS testimonials_active_idx
  ON testimonials (created_at DESC) WHERE active = true;

CREATE INDEX IF NOT EXISTS brokers_active_idx
  ON brokers (sort_order, name) WHERE active = true;

CREATE INDEX IF NOT EXISTS home_sections_active_idx
  ON home_sections (position) WHERE active = true;

CREATE INDEX IF NOT EXISTS properties_cache_type_expires_idx
  ON properties_cache (type, expires_at);

-- GIN para futuras queries por chave dentro do JSONB do cache
CREATE INDEX IF NOT EXISTS properties_cache_data_gin
  ON properties_cache USING GIN (data jsonb_path_ops);

-- =====================
-- Storage: lockdown de SVG (segurança XSS via SVG inline)
-- =====================
-- Remove image/svg+xml dos buckets `site` e `admin` para evitar XSS
-- caso uma SVG hostil seja renderizada inline no futuro.
-- Mantém JPEG/PNG/WebP/GIF/AVIF.
DO $$
DECLARE
  safe_mimes text[] := ARRAY[
    'image/jpeg','image/png','image/webp','image/gif','image/avif'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'site') THEN
    UPDATE storage.buckets
       SET allowed_mime_types = safe_mimes
     WHERE id = 'site';
  END IF;
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'admin') THEN
    UPDATE storage.buckets
       SET allowed_mime_types = safe_mimes
     WHERE id = 'admin';
  END IF;
END $$;
