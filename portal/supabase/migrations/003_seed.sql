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
