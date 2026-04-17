import type { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/comprar`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/alugar`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/empreendimentos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contato`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Dynamic property pages from cache
  try {
    const supabase = await createSupabaseServerClient()
    const { data: cached } = await supabase
      .from('properties_cache')
      .select('external_id, type, cached_at')
      .order('cached_at', { ascending: false })
      .limit(500)

    const dynamicPages: MetadataRoute.Sitemap = (cached ?? []).map((item) => ({
      url: item.type === 'empreendimento'
        ? `${SITE_URL}/empreendimentos/${item.external_id}`
        : `${SITE_URL}/imovel/${item.external_id}`,
      lastModified: new Date(item.cached_at),
      changeFrequency: 'daily',
      priority: 0.7,
    }))

    return [...staticPages, ...dynamicPages]
  } catch {
    return staticPages
  }
}
