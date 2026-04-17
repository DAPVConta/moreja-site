-- Branding extensions: logos separados header/footer, redes sociais extras, cor terciária
INSERT INTO site_config (key, value) VALUES
  ('logo_header_url', '""'::jsonb),
  ('logo_footer_url', '""'::jsonb),
  ('twitter',         '""'::jsonb),
  ('tiktok_url',      '""'::jsonb),
  ('tertiary_color',  '"#ededd1"'::jsonb)
ON CONFLICT (key) DO NOTHING;
