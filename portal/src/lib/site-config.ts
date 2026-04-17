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

export const getHomeSections = cache(async (): Promise<HomeSection[]> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('home_sections')
      .select('*')
      .eq('active', true)
      .order('position', { ascending: true })

    return (data ?? []) as HomeSection[]
  } catch {
    return []
  }
})

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
