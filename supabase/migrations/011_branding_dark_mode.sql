-- ────────────────────────────────────────────────────────────────
-- 011 — Branding: dark mode + paleta nova Morejá
--
-- Adiciona keys em site_config para tema light/dark e atualiza as
-- cores defaults para a paleta da marca: Glass Green / Slicker /
-- Ocean Cavern.
-- ────────────────────────────────────────────────────────────────

INSERT INTO site_config (key, value) VALUES
  -- Tema padrão: light | dark | system
  ('theme_default',             '"light"'),

  -- Paleta light (defaults para a marca Morejá — sobrescreve seed antigo)
  ('primary_color',             '"#010744"'),  -- Ocean Cavern (navy)
  ('accent_color',              '"#f2d22e"'),  -- Slicker (yellow CTA)
  ('tertiary_color',            '"#ededd1"'),  -- Glass Green (cream)

  -- Paleta dark
  ('primary_color_dark',        '"#0a1a6e"'),
  ('accent_color_dark',         '"#f2d22e"'),
  ('tertiary_color_dark',       '"#1a1a1a"'),

  -- Logos por tema
  ('logo_dark_url',             '""'),
  ('favicon_dark_url',          '""'),

  -- Tipografia opcional via admin (Google Fonts URL ou CSS @import)
  ('font_heading',              '"Raleway"'),
  ('font_body',                 '"Inter"')
ON CONFLICT (key) DO UPDATE
  -- Atualiza só se ainda estiver vazio/nulo, preservando overrides do admin
  SET value = EXCLUDED.value
  WHERE site_config.value IS NULL
     OR site_config.value::text = '""'
     OR site_config.value::text = 'null';
