import type { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

/**
 * Sitemap split via generateSitemaps:
 *   /sitemap.xml/0.xml — static pages + bairros
 *   /sitemap.xml/1.xml — imóveis (até 1000)
 *   /sitemap.xml/2.xml — empreendimentos (até 1000)
 *
 * Próximos índices podem ser adicionados se a base crescer (>50k urls/sitemap).
 * Limite Google: 50.000 URLs ou 50MB por arquivo.
 */
export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }]
}

export default async function sitemap({
  id,
}: {
  id: number
}): Promise<MetadataRoute.Sitemap> {
  if (id === 0) {
    // Static + neighborhood guides
    const staticPages: MetadataRoute.Sitemap = [
      { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: `${SITE_URL}/comprar`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
      { url: `${SITE_URL}/alugar`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
      { url: `${SITE_URL}/empreendimentos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
      { url: `${SITE_URL}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${SITE_URL}/contato`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ]

    try {
      const supabase = await createSupabaseServerClient()
      const { data: guides } = await supabase
        .from('neighborhood_guides')
        .select('slug, updated_at')
        .eq('status', 'published')

      const guidePages: MetadataRoute.Sitemap = (guides ?? []).map((g) => ({
        url: `${SITE_URL}/bairros/${g.slug}`,
        lastModified: new Date(g.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

      return [...staticPages, ...guidePages]
    } catch {
      return staticPages
    }
  }

  if (id === 1) {
    // Imóveis (com image sitemap embarcado em cada entrada)
    try {
      const supabase = await createSupabaseServerClient()
      const { data: cached } = await supabase
        .from('properties_cache')
        .select('external_id, cached_at, data')
        .eq('type', 'imovel')
        .order('cached_at', { ascending: false })
        .limit(1000)

      return (cached ?? []).map((item) => {
        const data = (item.data ?? {}) as { fotos?: string[]; titulo?: string }
        const fotos = (data.fotos ?? []).slice(0, 5)
        return {
          url: `${SITE_URL}/imovel/${item.external_id}`,
          lastModified: new Date(item.cached_at),
          changeFrequency: 'daily' as const,
          priority: 0.7,
          // Next.js Sitemap supports `images` array → emite <image:image><image:loc>
          images: fotos,
        }
      })
    } catch {
      return []
    }
  }

  if (id === 2) {
    // Empreendimentos
    try {
      const supabase = await createSupabaseServerClient()
      const { data: cached } = await supabase
        .from('properties_cache')
        .select('external_id, cached_at, data')
        .eq('type', 'empreendimento')
        .order('cached_at', { ascending: false })
        .limit(1000)

      return (cached ?? []).map((item) => {
        const data = (item.data ?? {}) as { fotos?: string[] }
        const fotos = (data.fotos ?? []).slice(0, 5)
        return {
          url: `${SITE_URL}/empreendimentos/${item.external_id}`,
          lastModified: new Date(item.cached_at),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
          images: fotos,
        }
      })
    } catch {
      return []
    }
  }

  return []
}
