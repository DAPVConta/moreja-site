-- ────────────────────────────────────────────────────────────────
-- 015 — Footer estruturado configurável
--
-- 4 colunas (Soluções, Empresa, Suporte, Legal) com links editáveis
-- pelo admin. Substitui a estrutura hardcoded em Footer.tsx.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS footer_columns (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  position   int NOT NULL DEFAULT 0,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS footer_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id   uuid NOT NULL REFERENCES footer_columns(id) ON DELETE CASCADE,
  label       text NOT NULL,
  href        text NOT NULL,
  target      text DEFAULT '_self' CHECK (target IN ('_self','_blank')),
  position    int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS footer_links_column_idx
  ON footer_links (column_id, position) WHERE active = true;

ALTER TABLE footer_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_links   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_footer_columns"
  ON footer_columns FOR SELECT USING (active = true);
CREATE POLICY "admin_all_footer_columns"
  ON footer_columns FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public_read_active_footer_links"
  ON footer_links FOR SELECT USING (active = true);
CREATE POLICY "admin_all_footer_links"
  ON footer_links FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Pré-popular
DO $$
DECLARE
  c_solucoes uuid;
  c_empresa  uuid;
  c_suporte  uuid;
  c_legal    uuid;
BEGIN
  -- Idempotente: só insere colunas se ainda não existirem
  IF NOT EXISTS (SELECT 1 FROM footer_columns WHERE title = 'Soluções') THEN
    INSERT INTO footer_columns (title, position) VALUES
      ('Soluções', 0),
      ('Empresa',  1),
      ('Suporte',  2),
      ('Legal',    3);
  END IF;

  SELECT id INTO c_solucoes FROM footer_columns WHERE title = 'Soluções' LIMIT 1;
  SELECT id INTO c_empresa  FROM footer_columns WHERE title = 'Empresa'  LIMIT 1;
  SELECT id INTO c_suporte  FROM footer_columns WHERE title = 'Suporte'  LIMIT 1;
  SELECT id INTO c_legal    FROM footer_columns WHERE title = 'Legal'    LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM footer_links WHERE column_id = c_solucoes) THEN
    INSERT INTO footer_links (column_id, label, href, position) VALUES
      (c_solucoes, 'Comprar imóvel',     '/comprar',          0),
      (c_solucoes, 'Alugar imóvel',      '/alugar',           1),
      (c_solucoes, 'Empreendimentos',    '/empreendimentos',  2),
      (c_solucoes, 'Avalie seu imóvel',  '/avaliar',          3);

    INSERT INTO footer_links (column_id, label, href, position) VALUES
      (c_empresa, 'Sobre nós',           '/sobre',            0),
      (c_empresa, 'Nossa equipe',        '/sobre#equipe',     1),
      (c_empresa, 'Trabalhe conosco',    '/carreiras',        2),
      (c_empresa, 'Imprensa',            '/imprensa',         3);

    INSERT INTO footer_links (column_id, label, href, position) VALUES
      (c_suporte, 'Fale conosco',        '/contato',          0),
      (c_suporte, 'WhatsApp',            'https://wa.me/',    1),
      (c_suporte, 'Perguntas frequentes','/faq',              2);

    INSERT INTO footer_links (column_id, label, href, position) VALUES
      (c_legal,   'Política de privacidade', '/privacidade', 0),
      (c_legal,   'Termos de uso',           '/termos',      1),
      (c_legal,   'LGPD',                    '/lgpd',        2),
      (c_legal,   'Cookies',                 '/cookies',     3);
  END IF;
END $$;
