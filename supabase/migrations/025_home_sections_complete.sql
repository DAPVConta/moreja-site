-- ────────────────────────────────────────────────────────────────
-- 025 — Home sections: completar paridade com src/app/page.tsx
--
-- O sectionMap em src/app/page.tsx renderiza 20 section_types, mas a
-- tabela só tinha 14 (006 + 008). Os 6 faltantes nunca apareciam no
-- admin /admin/layout-home, então não havia forma de controlá-los.
--
-- Inserimos como active=false para o admin escolher quais ativar, sem
-- mudar a aparência atual do site. Posições 14..19 ficam após as
-- existentes (admin pode reordenar via drag-and-drop).
-- ────────────────────────────────────────────────────────────────

INSERT INTO home_sections (section_type, label, position, active, config) VALUES
  ('team',            'Equipe / Corretores',          14, false, '{
    "title": "Conheça nosso time",
    "subtitle": "Especialistas prontos para encontrar o seu próximo lar",
    "cta_label": "Ver todos os corretores",
    "cta_href": "/sobre#equipe",
    "limit": 8
  }'::jsonb),
  ('valuation_cta',   'CTA — Avaliar Imóvel',         15, false, '{
    "title": "Quanto vale o seu imóvel?",
    "subtitle": "Receba uma avaliação gratuita feita por especialistas em até 24 horas.",
    "benefits": [
      "Análise comparativa de mercado",
      "Avaliação por corretor especialista",
      "Sem compromisso, 100% gratuito"
    ],
    "cta_label": "Avaliar agora",
    "cta_href": "/avaliar"
  }'::jsonb),
  ('coverage_map',    'Mapa de cobertura',            16, false, '{
    "title": "Onde a Morejá atua",
    "subtitle": "Cobertura completa nas principais regiões",
    "city_label": "Recife e Região Metropolitana",
    "cta_href": "/bairros",
    "regions": []
  }'::jsonb),
  ('recently_viewed', 'Imóveis vistos recentemente',  17, false, '{
    "title": "Você viu recentemente",
    "subtitle": "Continue de onde parou"
  }'::jsonb),
  ('blog_preview',    'Blog — últimos posts',         18, false, '{
    "title": "Do nosso blog",
    "subtitle": "Dicas, mercado e novidades sobre imóveis",
    "cta_label": "Ver todos os posts",
    "cta_href": "/blog"
  }'::jsonb),
  ('faq',             'Perguntas frequentes',         19, false, '{
    "title": "Perguntas frequentes",
    "subtitle": "Tire suas dúvidas sobre comprar, vender e alugar",
    "items": []
  }'::jsonb)
ON CONFLICT (section_type) DO NOTHING;
