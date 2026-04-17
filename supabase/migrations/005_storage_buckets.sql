-- ============================================================
-- Morejá Portal — Supabase Storage Buckets
-- Execute no Supabase SQL Editor
-- ============================================================

-- Bucket: site (imagens do portal público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site',
  'site',
  true,  -- público: qualquer um pode ler
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: admin (imagens do painel administrativo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin',
  'admin',
  true,  -- público para leitura (imagens de corretores, depoimentos, etc.)
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ── Policies para bucket "site" ───────────────────────────────────────────

-- Qualquer pessoa pode ler imagens públicas
CREATE POLICY "site_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site');

-- Apenas admins podem enviar imagens
CREATE POLICY "site_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site' AND is_admin());

-- Apenas admins podem atualizar imagens
CREATE POLICY "site_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site' AND is_admin());

-- Apenas admins podem deletar imagens
CREATE POLICY "site_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site' AND is_admin());

-- ── Policies para bucket "admin" ──────────────────────────────────────────

CREATE POLICY "admin_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'admin');

CREATE POLICY "admin_bucket_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'admin' AND is_admin());

CREATE POLICY "admin_bucket_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'admin' AND is_admin());

CREATE POLICY "admin_bucket_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'admin' AND is_admin());
