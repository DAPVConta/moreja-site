export interface SiteConfig {
  // Identidade
  company_name: string
  company_slogan: string
  logo_url: string | null          // Logo genérico (fallback)
  logo_header_url: string | null   // Logo específico do header (fundo claro)
  logo_footer_url: string | null   // Logo específico do footer (fundo escuro)
  favicon_url: string | null

  // Contato
  phone: string
  whatsapp: string
  whatsapp_full: string   // DDI incluído, ex: 5511999999999
  email: string
  address: string
  creci: string
  business_hours: string  // ex: "Seg–Sex 8h–18h · Sáb 8h–12h" (migration pendente)

  // Redes sociais
  instagram: string
  facebook: string
  youtube: string
  linkedin: string
  twitter: string
  tiktok_url: string

  // SEO
  meta_title: string
  meta_description: string
  og_image: string
  primary_color: string
  accent_color: string
  tertiary_color: string
  hero_image: string

  // Tema (migration 011) — light/dark
  theme_default: 'light' | 'dark' | 'system'
  primary_color_dark: string
  accent_color_dark: string
  tertiary_color_dark: string
  logo_dark_url: string | null
  favicon_dark_url: string | null
  font_heading: string
  font_body: string

  // Rastreamento & Analytics
  gtm_id: string                  // GTM-XXXXXXX
  fb_pixel_id: string             // Meta (Facebook) Pixel
  linkedin_partner_id: string     // LinkedIn Insight Tag
  linkedin_conversion_id: string  // LinkedIn Conversion ID (lead event)
  tiktok_pixel_id: string         // TikTok Pixel
  google_site_verification: string // Google Search Console
  bing_verification: string        // Bing Webmaster

  // Migration 012 — analytics extras
  ga4_measurement_id: string
  ga4_api_secret: string
  clarity_id: string
  hotjar_id: string
  hotjar_version: string
  meta_capi_access_token: string
  meta_capi_test_event_code: string
  default_og_template: string
  consent_mode_enabled: boolean
  consent_default_state: 'granted' | 'denied'
  cookiebot_id: string
  pinterest_tag_id: string
  bing_uet_id: string

  // Migration 024 — Cloudflare Turnstile
  turnstile_site_key: string
  turnstile_secret_key: string
}

export interface SiteStat {
  id: string
  key: string
  value: string
  label: string
  icon: string
  sort_order: number
}

export interface Testimonial {
  id: string
  name: string
  role: string | null
  text: string
  rating: number
  photo_url: string | null
  active: boolean
  created_at: string
}

export interface Banner {
  id: string
  page: string
  title: string | null
  subtitle: string | null
  cta_text: string | null
  cta_link: string | null
  image_url: string | null
  mobile_image_url: string | null
  position: number
  active: boolean
  created_at: string
}

export interface Broker {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  creci: string | null
  photo_url: string | null
  bio: string | null
  specialties: string[] | null
  active: boolean
  sort_order: number
  created_at: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  property_id: string | null
  property_title: string | null
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'closed'
  created_at: string
}
