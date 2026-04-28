-- ────────────────────────────────────────────────────────────────
-- 014 — Navegação configurável (header + drawer mobile)
--
-- Permite que o admin gerencie menus e itens (com sub-itens / mega-menu)
-- sem mexer no código. Substitui as listas hardcoded em Header.tsx e
-- HeaderMegaMenu.tsx.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nav_menus (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,    -- header_main, mobile_drawer, footer_quick
  location    text NOT NULL,           -- header | mobile | footer
  label       text,                    -- nome interno
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nav_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id     uuid NOT NULL REFERENCES nav_menus(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES nav_items(id) ON DELETE CASCADE,
  label       text NOT NULL,
  href        text NOT NULL,
  icon        text,                    -- ex: 'home', 'building', 'phone' (lucide-react)
  badge       text,                    -- ex: 'Novo', 'Lançamento'
  target      text DEFAULT '_self' CHECK (target IN ('_self','_blank')),
  position    int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  description text,                    -- usado no mega-menu como subtítulo
  image_url   text,                    -- opcional, para mega-menu visual
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nav_items_menu_idx
  ON nav_items (menu_id, parent_id, position);

CREATE INDEX IF NOT EXISTS nav_items_active_idx
  ON nav_items (active, position) WHERE active = true;

ALTER TABLE nav_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_nav_menus" ON nav_menus;
CREATE POLICY "public_read_active_nav_menus"
  ON nav_menus FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "admin_all_nav_menus" ON nav_menus;
CREATE POLICY "admin_all_nav_menus"
  ON nav_menus FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public_read_active_nav_items" ON nav_items;
CREATE POLICY "public_read_active_nav_items"
  ON nav_items FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "admin_all_nav_items" ON nav_items;
CREATE POLICY "admin_all_nav_items"
  ON nav_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Pré-popular com a navegação atual
INSERT INTO nav_menus (slug, location, label) VALUES
  ('header_main',    'header', 'Menu principal (desktop)'),
  ('mobile_drawer',  'mobile', 'Menu mobile (drawer)')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  m_header uuid;
  m_mobile uuid;
BEGIN
  SELECT id INTO m_header FROM nav_menus WHERE slug = 'header_main';
  SELECT id INTO m_mobile FROM nav_menus WHERE slug = 'mobile_drawer';

  -- Itens do header (idempotente: ON CONFLICT por (menu_id, label) não dá pq não há unique;
  -- usamos NOT EXISTS)
  IF NOT EXISTS (SELECT 1 FROM nav_items WHERE menu_id = m_header AND label = 'Comprar') THEN
    INSERT INTO nav_items (menu_id, label, href, position) VALUES
      (m_header, 'Comprar',          '/comprar',          0),
      (m_header, 'Alugar',           '/alugar',           1),
      (m_header, 'Empreendimentos',  '/empreendimentos',  2),
      (m_header, 'Sobre',            '/sobre',            3),
      (m_header, 'Contato',          '/contato',          4);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM nav_items WHERE menu_id = m_mobile AND label = 'Comprar') THEN
    INSERT INTO nav_items (menu_id, label, href, position, icon) VALUES
      (m_mobile, 'Comprar',          '/comprar',          0, 'home'),
      (m_mobile, 'Alugar',           '/alugar',           1, 'key'),
      (m_mobile, 'Empreendimentos',  '/empreendimentos',  2, 'building-2'),
      (m_mobile, 'Sobre',            '/sobre',            3, 'info'),
      (m_mobile, 'Contato',          '/contato',          4, 'message-circle');
  END IF;
END $$;
