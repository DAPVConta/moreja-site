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
