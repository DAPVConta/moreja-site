-- ============================================================
-- Morejá Portal — Configurações de rastreamento e SEO
-- Execute este arquivo no Supabase SQL Editor
-- ============================================================

INSERT INTO site_config (key, value) VALUES
  -- Google Tag Manager (GTM-XXXXXXX)
  ('gtm_id',                    '""'),

  -- Meta (Facebook) Pixel ID
  ('fb_pixel_id',               '""'),

  -- LinkedIn Insight Tag - Partner ID
  ('linkedin_partner_id',       '""'),

  -- LinkedIn Conversion ID (opcional — para eventos de lead)
  ('linkedin_conversion_id',    '""'),

  -- TikTok Pixel ID
  ('tiktok_pixel_id',           '""'),

  -- Google Search Console — conteúdo da meta tag "google-site-verification"
  ('google_site_verification',  '""'),

  -- Bing Webmaster Tools — conteúdo da meta tag "msvalidate.01"
  ('bing_verification',         '""'),

  -- WhatsApp com DDI (ex: 5511999999999) — usado no widget flutuante
  ('whatsapp_full',             '""')

ON CONFLICT (key) DO NOTHING;
