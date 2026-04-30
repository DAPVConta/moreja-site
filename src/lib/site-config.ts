import { cache } from 'react'
import { createSupabaseServerClient } from './supabase-server'
import type { SiteConfig, SiteStat, Testimonial, Broker, Banner } from '@/types/site'

/**
 * getSiteConfig is wrapped with React.cache() so multiple Server Components
 * that call it in the same request share a single Supabase query.
 */
export const getSiteConfig = cache(async (): Promise<Partial<SiteConfig>> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.from('site_config').select('key, value')

    if (!data) return {}

    return data.reduce<Record<string, unknown>>((acc, row) => {
      // Values are stored as JSON — unwrap strings
      const v = row.value
      acc[row.key] = typeof v === 'string' ? v : v
      return acc
    }, {}) as Partial<SiteConfig>
  } catch {
    return {}
  }
})

export async function getSiteStats(): Promise<SiteStat[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('site_stats')
      .select('*')
      .order('sort_order')

    return (data ?? []) as SiteStat[]
  } catch {
    return []
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    return (data ?? []) as Testimonial[]
  } catch {
    return []
  }
}

export async function getBrokers(): Promise<Broker[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('brokers')
      .select('*')
      .eq('active', true)
      .order('sort_order')

    return (data ?? []) as Broker[]
  } catch {
    return []
  }
}

export interface HomeSection {
  id: string
  section_type: string
  label: string
  position: number
  active: boolean
  config: Record<string, unknown>
}

// Migration 028: lê o snapshot da versão mais recente em `home_layout_versions`,
// nunca direto de `home_sections`. Garante que edições em andamento no admin
// não vazem para o site antes de salvar. Filtramos `active=true` no app (em
// vez de RLS), porque a versão é um jsonb opaco.
//
// Fallback para `home_sections` se ainda não existir nenhuma versão (ex.: env
// onde a migration 028 não rodou ainda). Mantém compatibilidade.
export const getHomeSections = cache(async (): Promise<HomeSection[]> => {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: versionRow } = await supabase
      .from('home_layout_versions')
      .select('sections')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (versionRow?.sections && Array.isArray(versionRow.sections)) {
      const sections = versionRow.sections as HomeSection[]
      return sections
        .filter((s) => s.active)
        .sort((a, b) => a.position - b.position)
    }

    const { data } = await supabase
      .from('home_sections')
      .select('*')
      .order('position', { ascending: true })

    return (data ?? []) as HomeSection[]
  } catch {
    return []
  }
})

/**
 * Blog post (migration 022).
 */
export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  category: string | null
  author_name: string | null
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  read_minutes: number | null
  views: number
  position: number
}

export const getRecentPosts = cache(
  async (limit = 3): Promise<BlogPost[]> => {
    try {
      const supabase = await createSupabaseServerClient()
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit)
      return (data ?? []) as BlogPost[]
    } catch {
      return []
    }
  }
)

export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    return data as BlogPost | null
  } catch {
    return null
  }
})

/**
 * SEO route record — para rotas não-CMS (/comprar, /alugar, etc).
 * Lê de seo_routes (migration 013).
 */
export interface SeoRoute {
  route: string
  title: string | null
  description: string | null
  og_image: string | null
  og_description: string | null
  canonical_url: string | null
  robots: string | null
  schema_jsonld: Record<string, unknown> | null
}

export const getSeoRoute = cache(async (route: string): Promise<SeoRoute | null> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('seo_routes')
      .select('*')
      .eq('route', route)
      .maybeSingle()
    return data as SeoRoute | null
  } catch {
    return null
  }
})

/**
 * Page CMS — pages publicadas (status='published' ou published=true).
 * Lê de pages (migration 016 ampliou com status).
 */
export interface PageRecord {
  id: string
  slug: string
  title: string | null
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  og_description: string | null
  canonical_url: string | null
  content: Record<string, unknown> | null
  status: string | null
  published: boolean
}

export const getPageBySlug = cache(async (slug: string): Promise<PageRecord | null> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .or('status.eq.published,published.eq.true')
      .maybeSingle()
    return data as PageRecord | null
  } catch {
    return null
  }
})

/**
 * Neighborhood guide — landing pages editoriais por bairro.
 * Lê de neighborhood_guides (migration 019).
 */
export interface NeighborhoodGuide {
  id: string
  slug: string
  city_slug: string
  name: string
  intro: string | null
  hero_image: string | null
  highlights: { label: string; value: string }[] | null
  schools: Record<string, unknown> | null
  transit: Record<string, unknown> | null
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  status: string
  position: number
}

export const getNeighborhoodGuide = cache(async (slug: string): Promise<NeighborhoodGuide | null> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('neighborhood_guides')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    return data as NeighborhoodGuide | null
  } catch {
    return null
  }
})

export const getNeighborhoodGuides = cache(async (): Promise<NeighborhoodGuide[]> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('neighborhood_guides')
      .select('*')
      .eq('status', 'published')
      .order('position')
    return (data ?? []) as NeighborhoodGuide[]
  } catch {
    return []
  }
})

/**
 * Helper unificado para gerar metadata de uma rota.
 * Combina SEO route override + page CMS + defaults.
 *
 * @param route Caminho da rota (ex: '/comprar') ou slug da page CMS
 * @param defaults Metadata default se nada for encontrado no banco
 */
export async function buildRouteMetadata(
  route: string,
  defaults: { title: string; description: string; canonical?: string }
): Promise<{
  title: string
  description: string
  canonical: string
  ogImage: string | undefined
  ogDescription: string
  robots: string
}> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'
  const seo = await getSeoRoute(route)
  const config = await getSiteConfig()

  return {
    title: seo?.title ?? defaults.title,
    description: seo?.description ?? defaults.description,
    canonical: seo?.canonical_url ?? `${SITE_URL}${defaults.canonical ?? route}`,
    ogImage: seo?.og_image ?? config.og_image ?? undefined,
    ogDescription: seo?.og_description ?? seo?.description ?? defaults.description,
    robots: seo?.robots ?? 'index,follow',
  }
}

export async function getBanners(page: string): Promise<Banner[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('page', page)
      .eq('active', true)
      .order('position')

    return (data ?? []) as Banner[]
  } catch {
    return []
  }
}
