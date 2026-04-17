import type { Property, PropertyFilters, PropertyListResponse } from '@/types/property'
import { createSupabaseServerClient } from './supabase-server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const PROXY_URL = `${SUPABASE_URL}/functions/v1/supremo-proxy`

async function proxyFetch(resource: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams({ resource })

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const res = await fetch(`${PROXY_URL}?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    next: { revalidate: 300 }, // 5 min cache on server
  })

  if (!res.ok) {
    throw new Error(`Proxy error: ${res.status}`)
  }

  return res.json()
}

export async function fetchProperties(filters: PropertyFilters = {}): Promise<PropertyListResponse> {
  let reason: 'error' | 'empty' | null = null
  try {
    const data = await proxyFetch('imoveis', {
      finalidade: filters.finalidade,
      tipo: filters.tipo,
      bairro: filters.bairro,
      cidade: filters.cidade,
      preco_min: filters.preco_min,
      preco_max: filters.preco_max,
      quartos: filters.quartos,
      q: filters.q,
      order: filters.order,
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
    }) as PropertyListResponse

    if (data?.data?.length > 0) return data
    reason = 'empty'
  } catch (err) {
    reason = 'error'
    console.error('[SUPREMO_PROXY_FALLBACK] fetchProperties falhou, indo para cache:', err)
  }

  const fallback = await fetchLocalProperties(filters)
  console.warn(
    `[SUPREMO_PROXY_FALLBACK] fetchProperties servindo cache (motivo=${reason}, itens=${fallback.data.length})`,
  )
  return fallback
}

export async function fetchProperty(id: string): Promise<Property | null> {
  let reason: 'error' | 'empty' | null = null
  try {
    const data = await proxyFetch(`imoveis/${id}`, {})
    if (data && (data as Property).id) return data as Property
    reason = 'empty'
  } catch (err) {
    reason = 'error'
    console.error('[SUPREMO_PROXY_FALLBACK] fetchProperty falhou, indo para cache:', err)
  }

  const fallback = await fetchLocalProperty(id)
  console.warn(
    `[SUPREMO_PROXY_FALLBACK] fetchProperty(${id}) servindo cache (motivo=${reason}, encontrado=${!!fallback})`,
  )
  return fallback
}

export async function fetchEmpreendimento(id: string): Promise<Property | null> {
  let reason: 'error' | 'empty' | null = null
  try {
    const data = await proxyFetch(`empreendimentos/${id}`, {})
    if (data && (data as Property).id) return data as Property
    reason = 'empty'
  } catch (err) {
    reason = 'error'
    console.error('[SUPREMO_PROXY_FALLBACK] fetchEmpreendimento falhou, indo para cache:', err)
  }

  const fallback = await fetchLocalProperty(id)
  console.warn(
    `[SUPREMO_PROXY_FALLBACK] fetchEmpreendimento(${id}) servindo cache (motivo=${reason}, encontrado=${!!fallback})`,
  )
  return fallback
}

export async function fetchFeaturedProperties(): Promise<Property[]> {
  const result = await fetchProperties({ destaque: true, limit: 6 })
  return result.data
}

// ── Fallback local: propriedades seedadas em properties_cache ──────────

async function fetchLocalProperties(filters: PropertyFilters): Promise<PropertyListResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('properties_cache')
      .select('data')
      .eq('type', 'imovel')

    if (!data || data.length === 0) {
      return { data: [], total: 0, page: filters.page ?? 1, limit: filters.limit ?? 12, pages: 0 }
    }

    let props = data.map((row) => row.data as Property)

    if (filters.destaque) props = props.filter((p) => p.destaque === true)
    if (filters.finalidade) props = props.filter((p) => p.finalidade === filters.finalidade)
    if (filters.tipo) {
      props = props.filter(
        (p) => p.subtipo === filters.tipo || p.tipo === filters.tipo,
      )
    }
    if (filters.bairro) {
      const b = filters.bairro.toLowerCase()
      props = props.filter((p) => p.bairro.toLowerCase().includes(b))
    }
    if (filters.cidade) {
      const c = filters.cidade.toLowerCase()
      props = props.filter((p) => p.cidade.toLowerCase().includes(c))
    }
    if (filters.preco_min) props = props.filter((p) => p.preco >= filters.preco_min!)
    if (filters.preco_max) props = props.filter((p) => p.preco <= filters.preco_max!)
    if (filters.quartos) props = props.filter((p) => p.quartos >= filters.quartos!)
    if (filters.q) {
      const q = filters.q.toLowerCase()
      props = props.filter(
        (p) =>
          p.titulo.toLowerCase().includes(q) ||
          p.descricao.toLowerCase().includes(q) ||
          p.bairro.toLowerCase().includes(q) ||
          p.cidade.toLowerCase().includes(q),
      )
    }

    switch (filters.order) {
      case 'preco_asc':
        props.sort((a, b) => a.preco - b.preco)
        break
      case 'preco_desc':
        props.sort((a, b) => b.preco - a.preco)
        break
      case 'data_desc':
        props.sort((a, b) =>
          (b.publicado_em ?? '').localeCompare(a.publicado_em ?? ''),
        )
        break
      default:
        // 'relevancia': destaques primeiro, depois mais recentes
        props.sort((a, b) => {
          if (a.destaque !== b.destaque) return a.destaque ? -1 : 1
          return (b.publicado_em ?? '').localeCompare(a.publicado_em ?? '')
        })
    }

    const page = filters.page ?? 1
    const limit = filters.limit ?? 12
    const total = props.length
    const start = (page - 1) * limit

    return {
      data: props.slice(start, start + limit),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    }
  } catch (err) {
    console.error('fetchLocalProperties error:', err)
    return { data: [], total: 0, page: filters.page ?? 1, limit: filters.limit ?? 12, pages: 0 }
  }
}

async function fetchLocalProperty(id: string): Promise<Property | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('properties_cache')
      .select('data')
      .eq('type', 'imovel')

    if (!data) return null
    const match = data.find((row) => {
      const p = row.data as Property
      return p.id === id || p.codigo === id || p.codigo?.toLowerCase() === id.toLowerCase()
    })
    return match ? (match.data as Property) : null
  } catch (err) {
    console.error('fetchLocalProperty error:', err)
    return null
  }
}

export async function fetchEmpreendimentos(filters: PropertyFilters = {}): Promise<PropertyListResponse> {
  try {
    const data = await proxyFetch('empreendimentos', {
      cidade: filters.cidade,
      q: filters.q,
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
    })

    return data as PropertyListResponse
  } catch (err) {
    console.error('fetchEmpreendimentos error:', err)
    return { data: [], total: 0, page: 1, limit: 12, pages: 0 }
  }
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatArea(value: number): string {
  return `${value.toLocaleString('pt-BR')} m²`
}
