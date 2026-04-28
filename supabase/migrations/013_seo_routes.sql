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
