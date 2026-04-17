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
