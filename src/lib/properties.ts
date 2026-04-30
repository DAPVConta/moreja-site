import type { Property, PropertyFilters, PropertyListResponse } from '@/types/property'
import { createSupabaseServerClient } from './supabase-server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const PROXY_URL = `${SUPABASE_URL}/functions/v1/supremo-proxy`

/**
 * ISR strategy:
 *   • Lists (/comprar, /alugar, /empreendimentos) — 5min revalidate
 *   • Detail (/imovel/[id], /empreendimentos/[id]) — 30min revalidate
 *   • Units (tipologias) — 1h revalidate
 *
 * O Supremo proxy edge function tem cache próprio (10min lists / 2h detail —
 * Bloco 7), então o Next.js ISR é uma camada adicional p/ reduzir invocations
 * do edge function.
 */
async function proxyFetch(
  resource: string,
  params: Record<string, string | number | undefined>,
  options?: { revalidate?: number }
) {
  const searchParams = new URLSearchParams({ resource })

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  // Default revalidate por tipo (override via options)
  const isUnits = /\/(unidades|tipologias)$/.test(resource)
  const isDetail = !isUnits && /\/[^/]+$/.test(resource)
  const defaultRevalidate = isUnits ? 3600 : isDetail ? 1800 : 300

  const res = await fetch(`${PROXY_URL}?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    next: { revalidate: options?.revalidate ?? defaultRevalidate },
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
      destaque: filters.destaque ? '1' : undefined,
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

export async function fetchFeaturedEmpreendimentos(): Promise<Property[]> {
  const result = await fetchEmpreendimentos({ destaque: true, limit: 6 })
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
    // `?? ''` em todo `.toLowerCase()`: Supremo às vezes retorna campos
    // nulos (descricao, bairro, cidade) e o filter crashava o Server
    // Component, levando o /comprar pra error.tsx ("Algo deu errado").
    if (filters.bairro) {
      const b = filters.bairro.toLowerCase()
      props = props.filter((p) => (p.bairro ?? '').toLowerCase().includes(b))
    }
    if (filters.cidade) {
      const c = filters.cidade.toLowerCase()
      props = props.filter((p) => (p.cidade ?? '').toLowerCase().includes(c))
    }
    if (filters.preco_min) props = props.filter((p) => p.preco >= filters.preco_min!)
    if (filters.preco_max) props = props.filter((p) => p.preco <= filters.preco_max!)
    if (filters.quartos) props = props.filter((p) => p.quartos >= filters.quartos!)
    if (filters.q) {
      const q = filters.q.toLowerCase()
      props = props.filter(
        (p) =>
          (p.titulo ?? '').toLowerCase().includes(q) ||
          (p.descricao ?? '').toLowerCase().includes(q) ||
          (p.bairro ?? '').toLowerCase().includes(q) ||
          (p.cidade ?? '').toLowerCase().includes(q),
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
      finalidade: filters.finalidade,
      tipo: filters.tipo,
      bairro: filters.bairro,
      cidade: filters.cidade,
      preco_min: filters.preco_min,
      preco_max: filters.preco_max,
      area_min: filters.area_min,
      area_max: filters.area_max,
      quartos: filters.quartos,
      q: filters.q,
      order: filters.order,
      destaque: filters.destaque ? '1' : undefined,
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
    })
    return data as PropertyListResponse
  } catch (err) {
    console.error('fetchEmpreendimentos error:', err)
    return { data: [], total: 0, page: 1, limit: 12, pages: 0 }
  }
}

/**
 * Tipologias / unidades de um empreendimento.
 * Endpoint Supremo: /empreendimentos/{id}/unidades (ou /tipologias).
 */
export interface EmpreendimentoUnit {
  id: string
  nome: string
  area: number
  quartos: number
  suites: number
  banheiros: number
  vagas: number
  preco: number
  planta_url?: string
}

export async function fetchUnits(empId: string): Promise<EmpreendimentoUnit[]> {
  try {
    const data = await proxyFetch(`empreendimentos/${empId}/unidades`, {})
    if (data && Array.isArray((data as { data?: unknown[] }).data)) {
      return (data as { data: EmpreendimentoUnit[] }).data
    }
    return []
  } catch (err) {
    console.error(`fetchUnits(${empId}) error:`, err)
    return []
  }
}

// Re-export para manter compatibilidade com chamadas existentes
// (server components que chamam formatPrice/formatArea daqui).
export { formatPrice, formatArea } from './format'
