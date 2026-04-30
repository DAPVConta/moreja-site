-- ────────────────────────────────────────────────────────────────
-- 027 — Remove a seção `coverage_map` da home
--
-- A migration 025 inseriu coverage_map ("Onde a Morejá atua" — lista de
-- bairros sobre fundo navy). A seção foi removida do produto: o site
-- agora tem `locations_map` (mapa Leaflet com pins reais), que é o que
-- ela queria ser. Sem motivo p/ manter as duas no admin.
--
-- Idempotente: nada acontece se a linha já não existir.
-- ────────────────────────────────────────────────────────────────

DELETE FROM home_sections WHERE section_type = 'coverage_map';
