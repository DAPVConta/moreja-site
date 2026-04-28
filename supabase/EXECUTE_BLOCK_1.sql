-- ════════════════════════════════════════════════════════════════
-- EXECUTE_BLOCK_1.sql — Cole TODO este arquivo no Supabase SQL Editor
--
-- Inclui as migrations 009 (Bloco 0) + 010-020 (Bloco 1).
-- 100% IDEMPOTENTE — pode rodar quantas vezes quiser sem dar erro.
--
-- Como aplicar:
--   1. Supabase Dashboard → SQL Editor → New Query
--   2. Cole o conteúdo INTEIRO deste arquivo
--   3. Run
--   4. RAISE NOTICE de resumo aparece no final em "Notices"
-- ════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════
-- 009_admin_users_and_security_hotfix.sql
-- ════════════════════════════════════════════════════════════════
-- ────────────────────────────────────────────────────────────────
-- 009 — Admin users + roles + security hotfix
--
-- Fixes 3 critical issues identified in the security audit:
--
-- 1. is_admin() previously read auth.jwt().user_metadata.role, which is
--    self-editable by any authenticated user via supabase.auth.updateUser.
--    Any signed-up user could promote themselves to admin and bypass RLS
--    on every CMS table. Now is_admin() queries the admin_users table,
--    which is writable only by service_role.
--
-- 2. leads had a public INSERT policy (public_insert_leads WITH CHECK true)
--    allowing anonymous flooding/scraping straight from the anon key.
--    The send-lead edge function (service_role) is the only legitimate
--    write path; we drop the public policy.
--
-- 3. Adds basic CHECK constraints on leads to limit input size.
-- ────────────────────────────────────────────────────────────────

-- =====================
-- admin_users table
-- =====================
CREATE TABLE IF NOT EXISTS admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'admin'
             CHECK (role IN ('owner','admin','editor','viewer')),
  full_name  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS admin_users_role_idx ON admin_users (role);

-- Service-role is the only writer. Owners can read the full list (for the
-- "Admin users" admin page). Other roles read only their own row.
DROP POLICY IF EXISTS "service_role_write_admin_users" ON admin_users;
CREATE POLICY "service_role_write_admin_users"
  ON admin_users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "owners_read_admin_users" ON admin_users;
CREATE POLICY "owners_read_admin_users"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users a
      WHERE a.user_id = auth.uid() AND a.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "self_read_admin_users" ON admin_users;
CREATE POLICY "self_read_admin_users"
  ON admin_users FOR SELECT
  USING (user_id = auth.uid());

-- =====================
-- Migrate existing admins from user_metadata
-- (best-effort: any existing user with user_metadata.role = 'admin' becomes
--  an owner so they don't lose access at the moment is_admin() is rewritten)
-- =====================
INSERT INTO admin_users (user_id, role)
SELECT id, 'owner'
FROM auth.users
WHERE (raw_user_meta_data ->> 'role') = 'admin'
   OR (raw_app_meta_data ->> 'role') = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- =====================
-- Rewrite is_admin() to read from admin_users
-- Editor and above are considered "admin" for write policies in RLS;
-- viewer is read-only (used by future per-table SELECT policies).
-- =====================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = auth.uid()
      AND role IN ('owner','admin','editor')
  );
$$;

-- Optional helper for finer-grained checks in future migrations
CREATE OR REPLACE FUNCTION admin_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT role FROM admin_users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =====================
-- Drop the wide-open public INSERT policy on leads
-- The send-lead edge function uses service_role and bypasses RLS.
-- =====================
DROP POLICY IF EXISTS "public_insert_leads" ON leads;

-- Keep admin_all_leads for dashboard reads/updates.
-- Add a service_role write policy so the edge function can keep inserting.
DROP POLICY IF EXISTS "service_role_write_leads" ON leads;
CREATE POLICY "service_role_write_leads"
  ON leads FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================
-- Basic input-size CHECK constraints on leads
-- (defence in depth — the edge function already sanitizes/truncates,
--  but RLS-bypassing service_role mistakes are still possible)
-- Idempotente via NOT EXISTS check em pg_constraint.
-- =====================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_name_length') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_name_length CHECK (length(name) BETWEEN 1 AND 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_email_length') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_email_length CHECK (length(email) BETWEEN 3 AND 320);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_phone_length') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_phone_length CHECK (phone IS NULL OR length(phone) <= 40);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_message_length') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_message_length CHECK (message IS NULL OR length(message) <= 5000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_email_format') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_email_format CHECK (email ~* '^[^[:space:]]+@[^[:space:]]+\.[^[:space:]]+$');
  END IF;
END $$;

COMMENT ON TABLE admin_users IS
  'Authoritative source for admin role membership. Replaces the previous '
  'is_admin() implementation that read user_metadata (user-editable). '
  'Only service_role can write here.';

-- ════════════════════════════════════════════════════════════════
-- 010_audit_log.sql
-- ════════════════════════════════════════════════════════════════
-- ────────────────────────────────────────────────────────────────
-- 010 — Audit log (quem mudou o quê, quando)
--
-- Cria tabela genérica `audit_log` + função `audit_trigger()` que
-- loga INSERT/UPDATE/DELETE em todas as tabelas críticas do CMS.
-- Habilita o "audit log viewer" no admin (Bloco 8).
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id           bigserial PRIMARY KEY,
  actor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email  text,
  actor_role   text,
  table_name   text NOT NULL,
  record_id    text,
  action       text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  diff         jsonb,
  ip           text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_table_idx     ON audit_log (table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx     ON audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_record_idx    ON audit_log (table_name, record_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_audit_log" ON audit_log;
CREATE POLICY "admin_read_audit_log"
  ON audit_log FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "service_role_write_audit_log" ON audit_log;
CREATE POLICY "service_role_write_audit_log"
  ON audit_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger genérico de auditoria
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_diff      jsonb;
  v_record_id text;
  v_email     text;
BEGIN
  v_email := coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    nullif((auth.jwt() ->> 'email'), '')
  );

  IF TG_OP = 'INSERT' THEN
    v_diff := to_jsonb(NEW);
    v_record_id := to_jsonb(NEW) ->> 'id';
  ELSIF TG_OP = 'UPDATE' THEN
    v_diff := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    v_record_id := to_jsonb(NEW) ->> 'id';
  ELSIF TG_OP = 'DELETE' THEN
    v_diff := to_jsonb(OLD);
    v_record_id := to_jsonb(OLD) ->> 'id';
  END IF;

  INSERT INTO audit_log (actor_id, actor_email, actor_role, table_name, record_id, action, diff)
  VALUES (auth.uid(), v_email, admin_role(), TG_TABLE_NAME, v_record_id, TG_OP, v_diff);

  RETURN coalesce(NEW, OLD);
END;
$$;

-- Anexa trigger nas tabelas críticas (idempotente via DROP + CREATE)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'site_config','pages','banners','testimonials','brokers',
    'home_sections','neighborhoods','site_stats','admin_users','leads'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION audit_trigger()',
      t, t
    );
  END LOOP;
END $$;

COMMENT ON TABLE audit_log IS
  'Log imutável de mudanças nas tabelas CMS. Apenas admin pode ler; '
  'apenas service_role pode escrever (via trigger SECURITY DEFINER).';

-- ════════════════════════════════════════════════════════════════
-- 011_branding_dark_mode.sql
-- ════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════
-- 012_tracking_extras.sql
-- ════════════════════════════════════════════════════════════════
-- ────────────────────────────────────────────────────────────────
-- 012 — Tracking & Analytics: GA4, Clarity, Hotjar, CAPI, slots
--
-- Adiciona keys em site_config (GA4 standalone, Microsoft Clarity,
-- Hotjar, Meta Conversion API token, default OG template, consent mode)
-- + tabela `tracking_scripts` para slots arbitrários (head/body_start/
-- body_end), permitindo o admin colar qualquer script.
-- ────────────────────────────────────────────────────────────────

INSERT INTO site_config (key, value) VALUES
  -- Google Analytics 4 (separado de GTM)
  ('ga4_measurement_id',        '""'),
  ('ga4_api_secret',            '""'),  -- para Measurement Protocol server-side

  -- Microsoft Clarity (heatmaps/recordings)
  ('clarity_id',                '""'),

  -- Hotjar
  ('hotjar_id',                 '""'),
  ('hotjar_version',            '"6"'),

  -- Meta Conversion API (server-side)
  ('meta_capi_access_token',    '""'),
  ('meta_capi_test_event_code', '""'),

  -- Default OG image template (URL para next/og ImageResponse base)
  ('default_og_template',       '""'),

  -- Consent Mode v2 (LGPD)
  ('consent_mode_enabled',      'true'),
  ('consent_default_state',     '"denied"'),  -- denied | granted

  -- Cookiebot / OneTrust (opcional)
  ('cookiebot_id',              '""'),

  -- LinkedIn Insight Tag partner ID (já existe? garantir presença)
  ('linkedin_partner_id',       '""'),

  -- TikTok Pixel (já existe? garantir presença)
  ('tiktok_pixel_id',           '""'),

  -- Pinterest Tag
  ('pinterest_tag_id',          '""'),

  -- Bing UET (Microsoft Ads)
  ('bing_uet_id',               '""')
ON CONFLICT (key) DO NOTHING;

-- =====================
-- tracking_scripts — slots arbitrários
-- =====================
CREATE TABLE IF NOT EXISTS tracking_scripts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  placement   text NOT NULL CHECK (placement IN ('head','body_start','body_end')),
  code        text NOT NULL,
  position    int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tracking_scripts_active_idx
  ON tracking_scripts (active, placement, position)
  WHERE active = true;

ALTER TABLE tracking_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_tracking_scripts" ON tracking_scripts;
CREATE POLICY "public_read_active_tracking_scripts"
  ON tracking_scripts FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "admin_all_tracking_scripts" ON tracking_scripts;
CREATE POLICY "admin_all_tracking_scripts"
  ON tracking_scripts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tracking_scripts_set_updated_at ON tracking_scripts;
CREATE TRIGGER tracking_scripts_set_updated_at
  BEFORE UPDATE ON tracking_scripts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE tracking_scripts IS
  'Slots para o admin colar scripts arbitrários (chat, A/B test, '
  'pixels custom). Renderizados conforme `placement`: head | '
  'body_start | body_end. Apenas active=true são exibidos.';

-- ════════════════════════════════════════════════════════════════
-- 013_seo_routes.sql
-- ════════════════════════════════════════════════════════════════
-- ────────────────────────────────────────────────────────────────
-- 013 — SEO por rota (não-CMS)
--
-- A tabela `pages` já permite SEO por slug, mas só serve rotas CMS.
-- Esta tabela cobre rotas não-CMS (/comprar, /alugar, /empreendimentos,
-- /sobre, /contato, defaults para /imovel/[id] e /empreendimentos/[id]).
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seo_routes (
  route          text PRIMARY KEY,                 -- ex: '/comprar', '/imovel/:id'
  title          text,
  description    text,
  og_image       text,
  og_description text,
  canonical_url  text,
  robots         text DEFAULT 'index,follow',      -- 'noindex,nofollow' p/ filter pages
  schema_jsonld  jsonb,                            -- override JSON-LD opcional
  notes          text,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seo_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_seo_routes" ON seo_routes;
CREATE POLICY "public_read_seo_routes"
  ON seo_routes FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_all_seo_routes" ON seo_routes;
CREATE POLICY "admin_all_seo_routes"
  ON seo_routes FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS seo_routes_set_updated_at ON seo_routes;
CREATE TRIGGER seo_routes_set_updated_at
  BEFORE UPDATE ON seo_routes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Pré-popular com rotas atuais do Next.js
INSERT INTO seo_routes (route, title, description) VALUES
  ('/comprar',
   'Imóveis à venda — Morejá Imobiliária',
   'Apartamentos, casas e imóveis comerciais à venda nas melhores localizações. Encontre seu imóvel ideal com a Morejá.'),
  ('/alugar',
   'Imóveis para alugar — Morejá Imobiliária',
   'Aluguel de apartamentos, casas e salas comerciais com segurança e agilidade. Confira os imóveis disponíveis.'),
  ('/empreendimentos',
   'Lançamentos e empreendimentos — Morejá Imobiliária',
   'Conheça os melhores lançamentos imobiliários. Plantas, valores e condições especiais de pré-lançamento.'),
  ('/sobre',
   'Sobre a Morejá — Tradição e confiança em imóveis',
   'Há anos atendendo famílias e investidores com excelência. Conheça nossa equipe, valores e diferenciais.'),
  ('/contato',
   'Fale com a Morejá — Atendimento personalizado',
   'Entre em contato com a Morejá Imobiliária. Atendimento por WhatsApp, telefone ou e-mail. Estamos prontos para ajudar.'),
  ('/imovel/:id',
   NULL,  -- usado apenas como fallback; a route real usa generateMetadata por imóvel
   'Detalhes do imóvel: fotos, características, valores e localização. Agende uma visita pela Morejá Imobiliária.'),
  ('/empreendimentos/:id',
   NULL,
   'Detalhes do empreendimento: plantas, tipologias, fase da obra e condições de venda.')
ON CONFLICT (route) DO NOTHING;

COMMENT ON TABLE seo_routes IS
  'SEO por rota para páginas não-CMS. Lido por generateMetadata() do '
  'Next.js. Use ":param" para rotas dinâmicas (fallback quando o '
  'item específico não tiver SEO próprio).';

-- ════════════════════════════════════════════════════════════════
-- 014_navigation.sql
-- ════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════
-- 015_footer_links.sql
-- ════════════════════════════════════════════════════════════════
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

DROP POLICY IF EXISTS "public_read_active_footer_columns" ON footer_columns;
CREATE POLICY "public_read_active_footer_columns"
  ON footer_columns FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "admin_all_footer_columns" ON footer_columns;
CREATE POLICY "admin_all_footer_columns"
  ON footer_columns FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public_read_active_footer_links" ON footer_links;
CREATE POLICY "public_read_active_footer_links"
  ON footer_links FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "admin_all_footer_links" ON footer_links;
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

-- ════════════════════════════════════════════════════════════════
-- 016_pages_revisions.sql
-- ════════════════════════════════════════════════════════════════
-- ────────────────────────────────────────────────────────────────
-- 016 — Pages: status (draft/published/archived) + histórico de revisões
--
-- Substitui o `published boolean` atual por `status` enum-like.
-- Mantém a coluna antiga durante a transição para não quebrar o site.
-- Adiciona `page_revisions` para histórico de versões.
-- ────────────────────────────────────────────────────────────────

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS status text
    DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived'));

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Migrar dados existentes: se published=true → status='published'
UPDATE pages
   SET status       = CASE WHEN published THEN 'published' ELSE 'draft' END,
       published_at = CASE WHEN published THEN coalesce(published_at, created_at, now()) END
 WHERE status IS NULL OR (status = 'draft' AND published = true);

CREATE INDEX IF NOT EXISTS pages_status_idx ON pages (status);
CREATE INDEX IF NOT EXISTS pages_published_idx ON pages (status, published_at DESC)
  WHERE status = 'published';

-- Atualizar a RLS de leitura pública para aceitar status='published'
-- (mantém a antiga ativa como fallback durante transição)
DROP POLICY IF EXISTS "public_read_published_pages" ON pages;
CREATE POLICY "public_read_published_pages"
  ON pages FOR SELECT
  USING (status = 'published' OR published = true);

-- =====================
-- page_revisions
-- =====================
CREATE TABLE IF NOT EXISTS page_revisions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  content     jsonb,
  meta        jsonb,             -- title, meta_title, meta_description, og_image, etc
  status      text,
  author_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_revisions_page_idx
  ON page_revisions (page_id, created_at DESC);

ALTER TABLE page_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_page_revisions" ON page_revisions;
CREATE POLICY "admin_all_page_revisions"
  ON page_revisions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "service_role_write_page_revisions" ON page_revisions;
CREATE POLICY "service_role_write_page_revisions"
  ON page_revisions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger: snapshot automático em INSERT/UPDATE de pages
CREATE OR REPLACE FUNCTION snapshot_page_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO page_revisions (
    page_id, content, meta, status, author_id, author_email
  ) VALUES (
    NEW.id,
    NEW.content,
    jsonb_build_object(
      'title',            NEW.title,
      'meta_title',       NEW.meta_title,
      'meta_description', NEW.meta_description,
      'og_image',         NEW.og_image,
      'og_description',   NEW.og_description,
      'canonical_url',    NEW.canonical_url
    ),
    NEW.status,
    auth.uid(),
    coalesce(nullif((auth.jwt() ->> 'email'), ''), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pages_snapshot_revision ON pages;
CREATE TRIGGER pages_snapshot_revision
  AFTER INSERT OR UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION snapshot_page_revision();

-- ════════════════════════════════════════════════════════════════
-- 017_ui_strings.sql
-- ════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════
-- 018_leads_supremo_utm.sql
-- ════════════════════════════════════════════════════════════════
-- ────────────────────────────────────────────────────────────────
-- 018 — Leads: enriquecimento UTM + sincronização com SupremoCRM
--
-- Adiciona colunas para:
--   • UTM tracking (utm_source/medium/campaign/content/term, gclid, fbclid)
--   • contexto da página (referrer, page_url, user_agent, ip_hash)
--   • consentimento LGPD
--   • sincronização com Supremo (id, status, attempts, last_error)
--   • broker assignment
--
-- Habilita o Bloco 7 (push de leads pro Supremo com retry queue).
-- ────────────────────────────────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS utm_source       text,
  ADD COLUMN IF NOT EXISTS utm_medium       text,
  ADD COLUMN IF NOT EXISTS utm_campaign     text,
  ADD COLUMN IF NOT EXISTS utm_content      text,
  ADD COLUMN IF NOT EXISTS utm_term         text,
  ADD COLUMN IF NOT EXISTS gclid            text,
  ADD COLUMN IF NOT EXISTS fbclid           text,
  ADD COLUMN IF NOT EXISTS referrer         text,
  ADD COLUMN IF NOT EXISTS page_url         text,
  ADD COLUMN IF NOT EXISTS user_agent       text,
  ADD COLUMN IF NOT EXISTS ip_hash          text,
  ADD COLUMN IF NOT EXISTS consent_lgpd     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS broker_id        uuid REFERENCES brokers(id) ON DELETE SET NULL,

  -- Sincronização com Supremo
  ADD COLUMN IF NOT EXISTS supremo_id       text,
  ADD COLUMN IF NOT EXISTS supremo_status   text DEFAULT 'pending'
    CHECK (supremo_status IN ('pending','synced','retry','failed','skipped')),
  ADD COLUMN IF NOT EXISTS supremo_attempts int  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supremo_last_error text,
  ADD COLUMN IF NOT EXISTS supremo_synced_at timestamptz,

  -- Tracking events (CAPI dedup, GA4 client_id)
  ADD COLUMN IF NOT EXISTS event_id         text,
  ADD COLUMN IF NOT EXISTS ga_client_id     text,
  ADD COLUMN IF NOT EXISTS fbp              text,
  ADD COLUMN IF NOT EXISTS fbc              text;

-- Índices para a fila de retry e dashboards
CREATE INDEX IF NOT EXISTS leads_supremo_retry_idx
  ON leads (supremo_status, created_at)
  WHERE supremo_status IN ('pending','retry');

CREATE INDEX IF NOT EXISTS leads_status_created_idx
  ON leads (status, created_at DESC);

CREATE INDEX IF NOT EXISTS leads_email_idx
  ON leads (email);

CREATE INDEX IF NOT EXISTS leads_utm_source_idx
  ON leads (utm_source) WHERE utm_source IS NOT NULL;

COMMENT ON COLUMN leads.supremo_status IS
  'pending  — ainda não sincronizado | '
  'synced   — POST /oportunidades retornou 2xx | '
  'retry    — falhou, aguarda próxima tentativa | '
  'failed   — esgotou tentativas (5) | '
  'skipped  — ignorado intencionalmente';

-- ════════════════════════════════════════════════════════════════
-- 019_engagement_features.sql
-- ════════════════════════════════════════════════════════════════
-- ────────────────────────────────────────────────────────────────
-- 019 — Features de engajamento e conversão
--
-- Tabelas que sustentam features das pesquisas de portais modernos:
--   • favorites             — usuário salvar imóvel
--   • saved_searches        — busca salva com alertas WhatsApp/email
--   • property_price_history — timeline de mudança de preço
--   • lancamentos_waitlist  — opt-in "Pré-Lançamento"
--   • valuation_requests    — wizard "Avalie seu imóvel"
--   • neighborhood_guides   — páginas editoriais de bairro (SEO moat)
-- ────────────────────────────────────────────────────────────────

-- =====================
-- favorites
-- =====================
CREATE TABLE IF NOT EXISTS favorites (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id text NOT NULL,
  property_title text,
  property_url   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_idx
  ON favorites (user_id, created_at DESC);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "self_read_favorites" ON favorites;
CREATE POLICY "self_read_favorites"
  ON favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "self_write_favorites" ON favorites;
CREATE POLICY "self_write_favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================
-- saved_searches
-- =====================
CREATE TABLE IF NOT EXISTS saved_searches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Permite "anônimo": só email + filtros
  email           text,
  name            text,
  filters         jsonb NOT NULL,         -- {finalidade, tipo, bairro, preco_min, preco_max, quartos, ...}
  alert_email     boolean DEFAULT true,
  alert_whatsapp  boolean DEFAULT false,
  alert_phone     text,
  last_notified_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS saved_searches_user_idx
  ON saved_searches (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS saved_searches_email_idx
  ON saved_searches (email) WHERE email IS NOT NULL;

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "self_read_saved_searches" ON saved_searches;
CREATE POLICY "self_read_saved_searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "self_write_saved_searches" ON saved_searches;
CREATE POLICY "self_write_saved_searches"
  ON saved_searches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "service_role_write_saved_searches" ON saved_searches;
CREATE POLICY "service_role_write_saved_searches"
  ON saved_searches FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "admin_read_saved_searches" ON saved_searches;
CREATE POLICY "admin_read_saved_searches"
  ON saved_searches FOR SELECT USING (is_admin());

-- =====================
-- property_price_history
-- =====================
CREATE TABLE IF NOT EXISTS property_price_history (
  id          bigserial PRIMARY KEY,
  property_id text NOT NULL,
  price       numeric(15,2),
  finalidade  text,                       -- 'venda' | 'aluguel'
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, finalidade, recorded_at)
);

CREATE INDEX IF NOT EXISTS property_price_history_idx
  ON property_price_history (property_id, recorded_at DESC);

ALTER TABLE property_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_price_history" ON property_price_history;
CREATE POLICY "public_read_price_history"
  ON property_price_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "service_role_write_price_history" ON property_price_history;
CREATE POLICY "service_role_write_price_history"
  ON property_price_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================
-- lancamentos_waitlist
-- =====================
CREATE TABLE IF NOT EXISTS lancamentos_waitlist (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  phone        text,
  name         text,
  lancamento_id text,                     -- opcional: específico ou geral
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  consent_lgpd boolean DEFAULT false,
  notified_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, lancamento_id)
);

ALTER TABLE lancamentos_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_write_waitlist" ON lancamentos_waitlist;
CREATE POLICY "service_role_write_waitlist"
  ON lancamentos_waitlist FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "admin_read_waitlist" ON lancamentos_waitlist;
CREATE POLICY "admin_read_waitlist"
  ON lancamentos_waitlist FOR SELECT USING (is_admin());

-- =====================
-- valuation_requests
-- =====================
CREATE TABLE IF NOT EXISTS valuation_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  email             text NOT NULL,
  phone             text,
  tipo              text,
  finalidade        text,
  bairro            text,
  cidade            text,
  area_total        numeric,
  dormitorios       int,
  banheiros         int,
  vagas             int,
  estimated_value   numeric,
  status            text DEFAULT 'new'
    CHECK (status IN ('new','contacted','scheduled','done','rejected')),
  notes             text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  consent_lgpd      boolean DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS valuation_requests_status_idx
  ON valuation_requests (status, created_at DESC);

ALTER TABLE valuation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_write_valuation" ON valuation_requests;
CREATE POLICY "service_role_write_valuation"
  ON valuation_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "admin_all_valuation" ON valuation_requests;
CREATE POLICY "admin_all_valuation"
  ON valuation_requests FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS valuation_requests_set_updated_at ON valuation_requests;
CREATE TRIGGER valuation_requests_set_updated_at
  BEFORE UPDATE ON valuation_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================
-- neighborhood_guides — landing pages editoriais (SEO)
-- =====================
CREATE TABLE IF NOT EXISTS neighborhood_guides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  city_slug       text NOT NULL,
  name            text NOT NULL,
  intro           text,                   -- ~300 palavras editorial
  hero_image      text,
  highlights      jsonb,                  -- [{label, value}] (preço m², walk score, etc)
  schools         jsonb,
  transit         jsonb,
  meta_title      text,
  meta_description text,
  og_image        text,
  status          text DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  position        int DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neighborhood_guides_status_idx
  ON neighborhood_guides (status, position) WHERE status = 'published';

ALTER TABLE neighborhood_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_neighborhood_guides" ON neighborhood_guides;
CREATE POLICY "public_read_published_neighborhood_guides"
  ON neighborhood_guides FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "admin_all_neighborhood_guides" ON neighborhood_guides;
CREATE POLICY "admin_all_neighborhood_guides"
  ON neighborhood_guides FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS neighborhood_guides_set_updated_at ON neighborhood_guides;
CREATE TRIGGER neighborhood_guides_set_updated_at
  BEFORE UPDATE ON neighborhood_guides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 020_rls_tightening_and_indexes.sql
-- ════════════════════════════════════════════════════════════════
-- ────────────────────────────────────────────────────────────────
-- 020 — RLS tightening + index pass
--
-- Fecha as últimas brechas que o audit de segurança apontou:
--   • properties_cache: só linhas não-expiradas, view sanitizada
--   • site_config: view pública só com keys "safe"
--   • indexes parciais para tabelas mais lidas
-- ────────────────────────────────────────────────────────────────

-- =====================
-- properties_cache — restringir leitura a linhas não-expiradas
-- =====================
DROP POLICY IF EXISTS "public_read_cache" ON properties_cache;
DROP POLICY IF EXISTS "public_read_active_cache" ON properties_cache;
CREATE POLICY "public_read_active_cache"
  ON properties_cache FOR SELECT
  USING (expires_at IS NULL OR expires_at > now());

-- =====================
-- site_config — projeção pública sem tokens/keys sensíveis
-- =====================
CREATE OR REPLACE VIEW public_site_config AS
  SELECT key, value
    FROM site_config
   WHERE key NOT IN (
     -- Tokens / secrets que NÃO devem vazar pro browser
     'meta_capi_access_token',
     'meta_capi_test_event_code',
     'ga4_api_secret',
     'supremo_jwt',
     'sendgrid_api_key',
     'resend_api_key',
     'twilio_auth_token',
     'whatsapp_api_token',
     'turnstile_secret_key',
     'recaptcha_secret_key',
     'webhook_signing_secret'
   );

-- A view não precisa de RLS própria; herda da tabela. Mas garantimos
-- que SELECT na tabela bruta exige admin para keys sensíveis.
DROP POLICY IF EXISTS "public_read_site_config" ON site_config;
DROP POLICY IF EXISTS "public_read_safe_site_config" ON site_config;
CREATE POLICY "public_read_safe_site_config"
  ON site_config FOR SELECT
  USING (
    is_admin()
    OR key NOT IN (
      'meta_capi_access_token',
      'meta_capi_test_event_code',
      'ga4_api_secret',
      'supremo_jwt',
      'sendgrid_api_key',
      'resend_api_key',
      'twilio_auth_token',
      'whatsapp_api_token',
      'turnstile_secret_key',
      'recaptcha_secret_key',
      'webhook_signing_secret'
    )
  );

GRANT SELECT ON public_site_config TO anon, authenticated;

-- =====================
-- Indexes parciais nas tabelas mais lidas
-- =====================
CREATE INDEX IF NOT EXISTS banners_active_position_idx
  ON banners (page, position) WHERE active = true;

CREATE INDEX IF NOT EXISTS testimonials_active_idx
  ON testimonials (created_at DESC) WHERE active = true;

CREATE INDEX IF NOT EXISTS brokers_active_idx
  ON brokers (sort_order, name) WHERE active = true;

CREATE INDEX IF NOT EXISTS home_sections_active_idx
  ON home_sections (position) WHERE active = true;

CREATE INDEX IF NOT EXISTS properties_cache_type_expires_idx
  ON properties_cache (type, expires_at);

-- GIN para futuras queries por chave dentro do JSONB do cache
CREATE INDEX IF NOT EXISTS properties_cache_data_gin
  ON properties_cache USING GIN (data jsonb_path_ops);

-- =====================
-- Storage: lockdown de SVG (segurança XSS via SVG inline)
-- =====================
-- Remove image/svg+xml dos buckets `site` e `admin` para evitar XSS
-- caso uma SVG hostil seja renderizada inline no futuro.
-- Mantém JPEG/PNG/WebP/GIF/AVIF.
DO $$
DECLARE
  safe_mimes text[] := ARRAY[
    'image/jpeg','image/png','image/webp','image/gif','image/avif'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'site') THEN
    UPDATE storage.buckets
       SET allowed_mime_types = safe_mimes
     WHERE id = 'site';
  END IF;
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'admin') THEN
    UPDATE storage.buckets
       SET allowed_mime_types = safe_mimes
     WHERE id = 'admin';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- RESUMO
-- ════════════════════════════════════════════════════════════════
DO $RESUMO$
DECLARE
  v_admin_count    int;
  v_audit_table    int;
  v_seo_routes     int;
  v_nav_menus      int;
  v_footer_columns int;
  v_ui_strings     int;
BEGIN
  SELECT count(*) INTO v_admin_count       FROM admin_users;
  SELECT count(*) INTO v_audit_table       FROM information_schema.tables WHERE table_name = 'audit_log';
  SELECT count(*) INTO v_seo_routes        FROM seo_routes;
  SELECT count(*) INTO v_nav_menus         FROM nav_menus;
  SELECT count(*) INTO v_footer_columns    FROM footer_columns;
  SELECT count(*) INTO v_ui_strings        FROM ui_strings;

  RAISE NOTICE '═════════════════════════════════════════════════════════════';
  RAISE NOTICE 'BLOCO 0 + 1 — APLICADO. Resumo:';
  RAISE NOTICE '═════════════════════════════════════════════════════════════';
  RAISE NOTICE '  admin_users (linhas)     %', v_admin_count;
  RAISE NOTICE '  audit_log (table)        % (esperado 1)', v_audit_table;
  RAISE NOTICE '  seo_routes (linhas)      % (esperado >= 7)', v_seo_routes;
  RAISE NOTICE '  nav_menus (linhas)       % (esperado >= 2)', v_nav_menus;
  RAISE NOTICE '  footer_columns (linhas)  % (esperado >= 4)', v_footer_columns;
  RAISE NOTICE '  ui_strings (linhas)      % (esperado >= 22)', v_ui_strings;
  RAISE NOTICE '═════════════════════════════════════════════════════════════';

  IF v_admin_count = 0 THEN
    RAISE WARNING '⚠ admin_users está VAZIA! Adicione manualmente:';
    RAISE WARNING '   INSERT INTO admin_users (user_id, role) SELECT id, ''owner''';
    RAISE WARNING '     FROM auth.users WHERE email = ''SEU_EMAIL''';
    RAISE WARNING '     ON CONFLICT (user_id) DO UPDATE SET role = ''owner'';';
  END IF;
END $RESUMO$;
