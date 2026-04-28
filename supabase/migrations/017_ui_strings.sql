-- ────────────────────────────────────────────────────────────────
-- 017 — UI Strings: textos do site editáveis pelo admin
--
-- Permite que o admin edite TODOS os textos da UI (botões, labels,
-- placeholders, mensagens) sem mexer em código. Suporta i18n futuro
-- via locale.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ui_strings (
  key         text NOT NULL,             -- ex: 'home.cta_anunciar.title'
  locale      text NOT NULL DEFAULT 'pt-BR',
  value       text NOT NULL,
  notes       text,                      -- contexto p/ tradutor/editor
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key, locale)
);

CREATE INDEX IF NOT EXISTS ui_strings_key_idx ON ui_strings (key);

ALTER TABLE ui_strings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_ui_strings" ON ui_strings;
CREATE POLICY "public_read_ui_strings"
  ON ui_strings FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_all_ui_strings" ON ui_strings;
CREATE POLICY "admin_all_ui_strings"
  ON ui_strings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS ui_strings_set_updated_at ON ui_strings;
CREATE TRIGGER ui_strings_set_updated_at
  BEFORE UPDATE ON ui_strings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Pré-popular com strings críticas usadas no site público
INSERT INTO ui_strings (key, locale, value, notes) VALUES
  ('header.cta_principal',       'pt-BR', 'Fale Conosco',                    'Botão amarelo no topo'),
  ('hero.search_placeholder',    'pt-BR', 'Bairro, cidade ou palavra-chave', 'Input de busca no hero'),
  ('hero.search_button',         'pt-BR', 'Buscar',                          'Botão amarelo dentro da busca'),
  ('hero.tab_buy',               'pt-BR', 'Comprar',                         ''),
  ('hero.tab_rent',              'pt-BR', 'Alugar',                          ''),
  ('hero.tab_launches',          'pt-BR', 'Empreendimentos',                 ''),
  ('cta_anunciar.title',         'pt-BR', 'Quer vender ou alugar seu imóvel?', ''),
  ('cta_anunciar.body',          'pt-BR', 'Conte com a Morejá para encontrar o melhor negócio. Nossa equipe de corretores está pronta para ajudar você.', ''),
  ('cta_anunciar.button',        'pt-BR', 'Anunciar meu imóvel',             ''),
  ('property.cta_whatsapp',      'pt-BR', 'Falar no WhatsApp',               ''),
  ('property.cta_visit',         'pt-BR', 'Agendar visita',                  ''),
  ('property.cta_save',          'pt-BR', 'Salvar imóvel',                   ''),
  ('property.shared_save',       'pt-BR', 'Compartilhar com co-comprador',   ''),
  ('lead_form.consent',          'pt-BR', 'Concordo com a política de privacidade.', 'Checkbox LGPD'),
  ('lead_form.submit',           'pt-BR', 'Enviar mensagem',                 ''),
  ('lead_form.success_title',    'pt-BR', 'Mensagem enviada!',               ''),
  ('lead_form.success_body',     'pt-BR', 'Em breve um corretor entrará em contato com você.', ''),
  ('newsletter.title',           'pt-BR', 'Receba lançamentos em primeira mão', ''),
  ('newsletter.placeholder',     'pt-BR', 'Seu melhor e-mail',               ''),
  ('newsletter.button',          'pt-BR', 'Quero receber',                   ''),
  ('search_alert.cta',           'pt-BR', 'Salvar busca e ser avisado',      ''),
  ('valuation.cta',              'pt-BR', 'Avalie seu imóvel grátis',        ''),
  ('launches.waitlist_cta',      'pt-BR', 'Seja avisado primeiro',           '')
ON CONFLICT (key, locale) DO NOTHING;

COMMENT ON TABLE ui_strings IS
  'Strings da UI editáveis pelo admin. Lidas via getUiStrings() server-side '
  'e cacheadas no Next.js (revalidate). Locale pt-BR é o default; '
  'outros locales podem ser adicionados depois sem mudança de schema.';
