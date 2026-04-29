-- ────────────────────────────────────────────────────────────────
-- 026 — Remover seção coverage_map da home
--
-- Cliente pediu pra retirar a seção "Onde a Morejá atua" do site
-- por ser redundante com os mapas já existentes nas páginas de
-- detalhe (PropertyMap em /imovel/[id] e /empreendimentos/[id]).
--
-- Removemos a row de home_sections para que a seção também suma do
-- /admin/layout-home. O componente CoverageMap.tsx + a entrada do
-- sectionMap em page.tsx + as referências no admin são removidos no
-- mesmo PR.
-- ────────────────────────────────────────────────────────────────

DELETE FROM home_sections WHERE section_type = 'coverage_map';
