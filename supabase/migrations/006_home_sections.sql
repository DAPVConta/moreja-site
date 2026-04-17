-- Home Sections: configuração de ordem/visibilidade dos blocos da home
CREATE TABLE IF NOT EXISTS home_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type text UNIQUE NOT NULL,
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_home_sections_position ON home_sections(position);

-- RLS
ALTER TABLE home_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_home_sections" ON home_sections;
CREATE POLICY "public_read_active_home_sections"
  ON home_sections FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "admin_read_all_home_sections" ON home_sections;
CREATE POLICY "admin_read_all_home_sections"
  ON home_sections FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "admin_write_home_sections" ON home_sections;
CREATE POLICY "admin_write_home_sections"
  ON home_sections FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_home_sections_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_home_sections_updated_at ON home_sections;
CREATE TRIGGER trg_home_sections_updated_at
  BEFORE UPDATE ON home_sections
  FOR EACH ROW
  EXECUTE FUNCTION set_home_sections_updated_at();

-- Seed das seções padrão (ordem inicial igual à home atual)
INSERT INTO home_sections (section_type, label, position, active) VALUES
  ('hero_search',         'Hero + Busca',              0, true),
  ('featured_properties', 'Imóveis em Destaque',       1, true),
  ('category_cards',      'O que Você Procura',        2, true),
  ('stats',               'Estatísticas',              3, true),
  ('testimonials',        'Depoimentos',               4, true),
  ('cta_anunciar',        'CTA — Anunciar Imóvel',     5, true)
ON CONFLICT (section_type) DO NOTHING;
