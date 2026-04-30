-- ────────────────────────────────────────────────────────────────
-- 026 — Home sections: nova seção `locations_map`
--
-- Mapa interativo (Leaflet + OpenStreetMap) travado na região
-- metropolitana do Recife com pins distintos para imóveis (amarelo,
-- ícone casa) e empreendimentos (navy, ícone prédio). Renderizado por
-- src/components/home/LocationsMap.tsx, controlado em
-- /admin/layout-home como qualquer outra seção da home.
--
-- Inserido como active=false para não alterar a aparência atual da
-- home — admin habilita pelo painel quando quiser.
-- ────────────────────────────────────────────────────────────────

INSERT INTO home_sections (section_type, label, position, active, config) VALUES
  ('locations_map', 'Mapa de localizações (pins)', 20, false, '{
    "title": "Onde estamos no Recife",
    "subtitle": "Explore o mapa para descobrir imóveis e empreendimentos próximos a você. Cada pin é um endereço real do nosso portfólio.",
    "city_label": "Recife e Região Metropolitana",
    "cta_href": "/comprar?cidade=Recife",
    "max_points_each_side": 60
  }'::jsonb)
ON CONFLICT (section_type) DO NOTHING;
