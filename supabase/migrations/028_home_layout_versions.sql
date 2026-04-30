-- ── Home Layout Versioning ──────────────────────────────────────────────────
-- Cada salvada do admin (HomeLayoutPage drag/drop OU SectionEditDialog) gera
-- uma nova versão completa do layout. O site público sempre lê a versão mais
-- recente — nunca a tabela viva `home_sections` — para garantir que mudanças
-- em andamento não vazem.
--
-- Decisões aplicadas:
--   • Toda salvada publica imediatamente (sem rascunho).
--   • Sem UI de histórico (mas o histórico fica no banco).
--   • Cobre apenas `home_sections` (página inicial).
--
-- Modelo: 1 linha por versão, snapshot completo em jsonb. Nada de tabela
-- filha — simplifica leitura (1 query), atomicidade de save (1 INSERT).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS home_layout_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number int GENERATED ALWAYS AS IDENTITY,
  sections jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_home_layout_versions_created_at
  ON home_layout_versions (created_at DESC);

ALTER TABLE home_layout_versions ENABLE ROW LEVEL SECURITY;

-- Leitura pública: o conteúdo é o layout do site público, então qualquer
-- visitante anônimo (e Server Components com anon key) precisam ler.
DROP POLICY IF EXISTS "public_read_home_layout_versions" ON home_layout_versions;
CREATE POLICY "public_read_home_layout_versions"
  ON home_layout_versions FOR SELECT
  USING (true);

-- INSERT só via RPC `bump_home_layout_version` (SECURITY DEFINER + is_admin
-- check). Sem policy de INSERT pra usuário direto: nenhuma rota não-RPC
-- consegue gravar.

-- ── RPC: snapshot atômico de home_sections para uma nova versão ──────────────
-- Chamada após qualquer UPDATE em home_sections (drag/drop ou edição de
-- config). Lê o estado atual de home_sections e congela como nova versão.

CREATE OR REPLACE FUNCTION public.bump_home_layout_version()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Forbidden: only admins can bump home layout version';
  END IF;

  INSERT INTO home_layout_versions (sections, created_by)
  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id',           id,
          'section_type', section_type,
          'label',        label,
          'position',     position,
          'active',       active,
          'config',       config
        ) ORDER BY position
      ),
      '[]'::jsonb
    ),
    auth.uid()
  FROM home_sections
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.bump_home_layout_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_home_layout_version() TO authenticated;

-- ── Seed v1 a partir do estado atual de home_sections ────────────────────────
-- Garante que o site tenha uma versão pra ler antes da primeira salvada
-- pós-deploy. Idempotente: só insere se ainda não existir nenhuma versão.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM home_layout_versions LIMIT 1) THEN
    INSERT INTO home_layout_versions (sections, created_by)
    SELECT
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id',           id,
            'section_type', section_type,
            'label',        label,
            'position',     position,
            'active',       active,
            'config',       config
          ) ORDER BY position
        ),
        '[]'::jsonb
      ),
      NULL
    FROM home_sections;
  END IF;
END
$$;
