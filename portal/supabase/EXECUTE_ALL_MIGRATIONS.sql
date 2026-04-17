-- ============================================================
-- Morejá Portal — Schema inicial
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- site_config
-- =====================
CREATE TABLE IF NOT EXISTS site_config (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text UNIQUE NOT NULL,
  value      jsonb,
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_site_config_updated_at
  BEFORE UPDATE ON site_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- =====================
-- pages
-- =====================
CREATE TABLE IF NOT EXISTS pages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,
  title            text NOT NULL,
  content          jsonb,
  meta_title       text,
  meta_description text,
  og_image         text,
  og_description   text,
  canonical_url    text,
  published        boolean DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
CREATE TRIGGER trg_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- =====================
-- banners
-- =====================
CREATE TABLE IF NOT EXISTS banners (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page             text NOT NULL DEFAULT 'home',
  title            text,
  subtitle         text,
  cta_text         text,
  cta_link         text,
  image_url        text,
  mobile_image_url text,
  position         integer DEFAULT 0,
  active           boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- =====================
-- testimonials
-- =====================
CREATE TABLE IF NOT EXISTS testimonials (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  role       text,
  text       text NOT NULL,
  rating     integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  photo_url  text,
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- =====================
-- leads
-- =====================
CREATE TABLE IF NOT EXISTS leads (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  email          text NOT NULL,
  phone          text,
  message        text,
  property_id    text,
  property_title text,
  source         text DEFAULT 'contato',
  status         text DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed')),
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- =====================
-- brokers
-- =====================
CREATE TABLE IF NOT EXISTS brokers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  email        text,
  phone        text,
  whatsapp     text,
  creci        text,
  photo_url    text,
  bio          text,
  specialties  text[],
  active       boolean DEFAULT true,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;

-- =====================
-- properties_cache
-- =====================
CREATE TABLE IF NOT EXISTS properties_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE NOT NULL,
  type        text NOT NULL DEFAULT 'imovel',
  data        jsonb NOT NULL,
  cached_at   timestamptz DEFAULT now(),
  expires_at  timestamptz DEFAULT (now() + INTERVAL '2 hours')
);
ALTER TABLE properties_cache ENABLE ROW LEVEL SECURITY;

-- =====================
-- neighborhoods
-- =====================
CREATE TABLE IF NOT EXISTS neighborhoods (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name   text NOT NULL,
  city   text NOT NULL,
  state  text DEFAULT 'SP',
  active boolean DEFAULT true
);
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

-- =====================
-- site_stats
-- =====================
CREATE TABLE IF NOT EXISTS site_stats (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text UNIQUE NOT NULL,
  value      text NOT NULL,
  label      text NOT NULL,
  icon       text,
  sort_order integer DEFAULT 0
);
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
-- ============================================================
-- Morejá Portal — RLS Policies
-- ============================================================

-- Helper: check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- site_config
-- =====================
CREATE POLICY "public_read_site_config"
  ON site_config FOR SELECT USING (true);

CREATE POLICY "admin_write_site_config"
  ON site_config FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- pages
-- =====================
CREATE POLICY "public_read_published_pages"
  ON pages FOR SELECT USING (published = true);

CREATE POLICY "admin_all_pages"
  ON pages FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- banners
-- =====================
CREATE POLICY "public_read_active_banners"
  ON banners FOR SELECT USING (active = true);

CREATE POLICY "admin_all_banners"
  ON banners FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- testimonials
-- =====================
CREATE POLICY "public_read_active_testimonials"
  ON testimonials FOR SELECT USING (active = true);

CREATE POLICY "admin_all_testimonials"
  ON testimonials FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- leads
-- =====================
CREATE POLICY "public_insert_leads"
  ON leads FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_all_leads"
  ON leads FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- brokers
-- =====================
CREATE POLICY "public_read_active_brokers"
  ON brokers FOR SELECT USING (active = true);

CREATE POLICY "admin_all_brokers"
  ON brokers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- properties_cache
-- =====================
CREATE POLICY "public_read_cache"
  ON properties_cache FOR SELECT USING (true);

CREATE POLICY "service_role_write_cache"
  ON properties_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================
-- neighborhoods
-- =====================
CREATE POLICY "public_read_active_neighborhoods"
  ON neighborhoods FOR SELECT USING (active = true);

CREATE POLICY "admin_all_neighborhoods"
  ON neighborhoods FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- site_stats
-- =====================
CREATE POLICY "public_read_site_stats"
  ON site_stats FOR SELECT USING (true);

CREATE POLICY "admin_all_site_stats"
  ON site_stats FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
-- ============================================================
-- Morejá Portal — Dados iniciais
-- ============================================================

-- site_config
INSERT INTO site_config (key, value) VALUES
  ('company_name',      '"Morejá Imobiliária"'),
  ('company_slogan',    '"Realize o sonho da casa própria"'),
  ('logo_url',          'null'),
  ('favicon_url',       'null'),
  ('phone',             '"(11) 99999-9999"'),
  ('whatsapp',          '"5511999999999"'),
  ('email',             '"contato@moreja.com.br"'),
  ('address',           '"Rua Exemplo, 123 - São Paulo/SP"'),
  ('instagram',         '"https://instagram.com/morejaimoveis"'),
  ('facebook',          '"https://facebook.com/morejaimoveis"'),
  ('youtube',           '""'),
  ('linkedin',          '""'),
  ('creci',             '"CRECI-SP 00000-J"'),
  ('meta_title',        '"Morejá Imobiliária | Encontre o imóvel dos seus sonhos"'),
  ('meta_description',  '"A Morejá Imobiliária oferece os melhores imóveis residenciais e comerciais. Compre, alugue ou invista com a segurança de quem entende do mercado."'),
  ('og_image',          '""'),
  ('primary_color',     '"#010744"'),
  ('accent_color',      '"#f2d22e"'),
  ('hero_image',        '""')
ON CONFLICT (key) DO NOTHING;

-- site_stats
INSERT INTO site_stats (key, value, label, icon, sort_order) VALUES
  ('anos_mercado',          '10',    'Anos de Mercado',        'calendar',    1),
  ('imoveis_vendidos',      '500+',  'Imóveis Vendidos',       'home',        2),
  ('clientes_satisfeitos',  '98%',   'Clientes Satisfeitos',   'heart',       3),
  ('corretores',            '15',    'Corretores Especializados','users',      4)
ON CONFLICT (key) DO NOTHING;

-- testimonials de exemplo
INSERT INTO testimonials (name, role, text, rating, active) VALUES
  ('Carlos Silva',    'Comprador',  'Excelente atendimento! A equipe da Morejá me ajudou a encontrar o apartamento perfeito dentro do meu orçamento. Super recomendo!', 5, true),
  ('Maria Oliveira',  'Vendedora',  'Vendi meu imóvel em tempo recorde graças à Morejá. Processo transparente e profissional do início ao fim.', 5, true),
  ('João Santos',     'Comprador',  'Ótima experiência! Os corretores são muito atenciosos e conhecem bem o mercado local. Fiquei muito satisfeito.', 5, true)
ON CONFLICT DO NOTHING;

-- página home
INSERT INTO pages (slug, title, meta_title, meta_description, published) VALUES
  ('home', 'Início', 'Morejá Imobiliária | Encontre o imóvel dos seus sonhos', 'A Morejá Imobiliária oferece os melhores imóveis residenciais e comerciais em São Paulo.', true),
  ('sobre', 'Sobre Nós', 'Sobre a Morejá Imobiliária', 'Conheça a história e os valores da Morejá Imobiliária.', true),
  ('contato', 'Contato', 'Contato | Morejá Imobiliária', 'Entre em contato com a Morejá Imobiliária. Estamos prontos para ajudá-lo.', true)
ON CONFLICT (slug) DO NOTHING;
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
