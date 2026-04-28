-- ────────────────────────────────────────────────────────────────
-- 022 — Blog posts (RE/MAX-inspired editorial content)
--
-- Tabela `posts` para blog/notícias do mercado imobiliário (SEO long-tail).
-- Reaproveita o padrão de pages.status (draft/published/archived) e adiciona
-- categorias + cover image + excerpt.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  title         text NOT NULL,
  excerpt       text,
  content       text,                          -- markdown ou HTML sanitizado
  cover_image   text,
  category      text,                          -- 'mercado','dicas','financiamento',...
  author_name   text,
  author_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','published','archived')),
  published_at  timestamptz,
  meta_title    text,
  meta_description text,
  og_image      text,
  read_minutes  int,                           -- estimativa de leitura
  views         int NOT NULL DEFAULT 0,
  position      int DEFAULT 0,                 -- p/ override de ordenação
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_published_idx
  ON posts (status, published_at DESC) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS posts_category_idx
  ON posts (category, published_at DESC) WHERE status = 'published';

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_posts" ON posts;
CREATE POLICY "public_read_published_posts"
  ON posts FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "admin_all_posts" ON posts;
CREATE POLICY "admin_all_posts"
  ON posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS posts_set_updated_at ON posts;
CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Anexa audit_trigger (criada na 010)
DROP TRIGGER IF EXISTS audit_posts ON posts;
CREATE TRIGGER audit_posts
  AFTER INSERT OR UPDATE OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

COMMENT ON TABLE posts IS
  'Blog/editorial — alimenta /blog e BlogPreview na home. SEO long-tail.';
