-- ────────────────────────────────────────────────────────────────
-- 008 — Home sections adicionais (padrão RE/MAX)
-- Adiciona as seções de credibilidade, proposta de valor, imóveis
-- residencial/comercial separados, cidades em destaque e lançamentos
-- ────────────────────────────────────────────────────────────────

INSERT INTO home_sections (section_type, label, position, active, config) VALUES
  ('trust_stats',         'Credibilidade (números da rede)',      6,  true,  '{
    "title": "Uma rede que você pode confiar",
    "items": [
      {"value": "15+",  "label": "anos de experiência no mercado"},
      {"value": "2.000+","label": "imóveis intermediados"},
      {"value": "1",    "label": "novo lar entregue a cada 3 dias"}
    ]
  }'::jsonb),
  ('value_proposition',   'Proposta de valor',                    7,  true,  '{
    "eyebrow": "Sobre a Morejá",
    "title": "Conte com a experiência de quem conhece cada bairro",
    "body": "Atuamos com imóveis residenciais e comerciais, oferecendo assessoria completa — da busca à escritura. Transparência, tecnologia e atendimento próximo em cada etapa.",
    "cta_label": "Conheça a Morejá",
    "cta_href": "/sobre"
  }'::jsonb),
  ('residential_featured','Destaques Residencial',                8,  false, '{
    "title": "Residencial em destaque",
    "subtitle": "Apartamentos, casas e coberturas para sua família",
    "href_all": "/comprar?tipo=Residencial"
  }'::jsonb),
  ('commercial_featured', 'Destaques Comercial',                  9,  false, '{
    "title": "Comercial em destaque",
    "subtitle": "Salas, lojas e galpões para o seu negócio",
    "href_all": "/comprar?tipo=Comercial"
  }'::jsonb),
  ('featured_cities',     'Cidades atendidas',                    10, false, '{
    "title": "Onde atuamos",
    "subtitle": "Escolha sua cidade e encontre o imóvel ideal",
    "cities": [
      {"name": "São Paulo",       "slug": "sao-paulo",        "count": "1.200+ imóveis"},
      {"name": "Guarulhos",       "slug": "guarulhos",        "count": "350+ imóveis"},
      {"name": "Santo André",     "slug": "santo-andre",      "count": "280+ imóveis"},
      {"name": "São Bernardo",    "slug": "sao-bernardo",     "count": "210+ imóveis"},
      {"name": "Osasco",          "slug": "osasco",           "count": "180+ imóveis"},
      {"name": "Diadema",         "slug": "diadema",          "count": "120+ imóveis"}
    ]
  }'::jsonb),
  ('launches_preview',    'Lançamentos & Empreendimentos',        11, false, '{
    "title": "Lançamentos exclusivos",
    "subtitle": "Empreendimentos com condições especiais direto da construtora",
    "href_all": "/empreendimentos"
  }'::jsonb)
ON CONFLICT (section_type) DO NOTHING;
