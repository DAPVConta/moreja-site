-- ============================================================
-- Morejá Portal — RLS Policies
-- ============================================================

-- Helper: check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- site_config
-- =====================
CREATE POLICY "public_read_site_config"
  ON site_config FOR SELECT USING (true);

CREATE POLICY "admin_write_site_config"
  ON site_config FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- pages
-- =====================
CREATE POLICY "public_read_published_pages"
  ON pages FOR SELECT USING (published = true);

CREATE POLICY "admin_all_pages"
  ON pages FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- banners
-- =====================
CREATE POLICY "public_read_active_banners"
  ON banners FOR SELECT USING (active = true);

CREATE POLICY "admin_all_banners"
  ON banners FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- testimonials
-- =====================
CREATE POLICY "public_read_active_testimonials"
  ON testimonials FOR SELECT USING (active = true);

CREATE POLICY "admin_all_testimonials"
  ON testimonials FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- leads
-- =====================
CREATE POLICY "public_insert_leads"
  ON leads FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_all_leads"
  ON leads FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- brokers
-- =====================
CREATE POLICY "public_read_active_brokers"
  ON brokers FOR SELECT USING (active = true);

CREATE POLICY "admin_all_brokers"
  ON brokers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- properties_cache
-- =====================
CREATE POLICY "public_read_cache"
  ON properties_cache FOR SELECT USING (true);

CREATE POLICY "service_role_write_cache"
  ON properties_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================
-- neighborhoods
-- =====================
CREATE POLICY "public_read_active_neighborhoods"
  ON neighborhoods FOR SELECT USING (active = true);

CREATE POLICY "admin_all_neighborhoods"
  ON neighborhoods FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================
-- site_stats
-- =====================
CREATE POLICY "public_read_site_stats"
  ON site_stats FOR SELECT USING (true);

CREATE POLICY "admin_all_site_stats"
  ON site_stats FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
