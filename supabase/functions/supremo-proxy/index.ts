import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const SUPREMO_JWT = Deno.env.get('SUPREMO_JWT')!
const SUPREMO_API_URL = Deno.env.get('SUPREMO_API_URL') ?? 'https://api.supremocrm.com.br/v1'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Rate limiting: simple in-memory store (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 100
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false

  entry.count++
  return true
}

function buildSupremoUrl(resource: string, params: URLSearchParams): string {
  const supremoParams = new URLSearchParams()

  // Param mapping: app names → Supremo API names
  const paramMap: Record<string, string> = {
    page: 'pagina',
    limit: 'por_pagina',
    tipo: 'tipo',
    finalidade: 'finalidade',
    bairro: 'bairro',
    cidade: 'cidade',
    preco_min: 'preco_min',
    preco_max: 'preco_max',
    area_min: 'area_min',
    area_max: 'area_max',
    quartos: 'quartos',
    q: 'busca',
    order: 'ordem',
  }

  for (const [appKey, supremoKey] of Object.entries(paramMap)) {
    const value = params.get(appKey)
    if (value) supremoParams.set(supremoKey, value)
  }

  return `${SUPREMO_API_URL}/${resource}?${supremoParams.toString()}`
}

// Map Supremo finalidade number to string
function mapFinalidade(f: number | string | null): 'Venda' | 'Locação' | 'Venda e Locação' {
  const n = Number(f)
  if (n === 2) return 'Locação'
  if (n === 3) return 'Venda e Locação'
  return 'Venda'
}

// Safely parse a float from string or number
function parseNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? 0 : n
}

// Extract pure number from strings like "120m²" or "120"
function parseArea(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  const cleaned = String(v).replace(/[^\d.,]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

// Normalise a Supremo imovel record to our Property shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeImovel(raw: Record<string, any>) {
  return {
    id: String(raw.id ?? ''),
    codigo: raw.codigo ?? String(raw.id ?? ''),
    titulo: raw.titulo ?? raw.nome ?? '',
    tipo: raw.tipo ?? raw.nome_tipo ?? '',
    subtipo: raw.subtipo ?? raw.nome_subtipo ?? undefined,
    finalidade: mapFinalidade(raw.finalidade),
    preco: parseNum(raw.preco),
    preco_condominio: raw.preco_condominio ? parseNum(raw.preco_condominio) : undefined,
    preco_iptu: raw.preco_iptu ? parseNum(raw.preco_iptu) : undefined,
    bairro: raw.bairro ?? raw.brasil_bairro ?? '',
    cidade: raw.cidade ?? raw.brasil_cidade ?? '',
    estado: raw.estado ?? raw.brasil_estado_uf ?? '',
    cep: raw.cep ?? undefined,
    endereco: raw.endereco ?? undefined,
    numero: raw.numero ?? undefined,
    complemento: raw.complemento || undefined,
    area_total: parseArea(raw.area_total),
    area_util: raw.area_util ? parseArea(raw.area_util) : parseArea(raw.area_privativa),
    area_terreno: raw.area_terreno ? parseArea(raw.area_terreno) : undefined,
    quartos: parseNum(raw.quartos),
    suites: raw.suites ? parseNum(raw.suites) : undefined,
    banheiros: parseNum(raw.banheiros),
    vagas: raw.vagas ? parseNum(raw.vagas) : parseNum(raw.garagens),
    descricao: raw.descricao ?? '',
    fotos: Array.isArray(raw.fotos) ? raw.fotos : [],
    video_url: raw.video_url ?? undefined,
    tour_virtual: raw.tour_virtual ?? undefined,
    latitude: raw.latitude ? parseNum(raw.latitude) : undefined,
    longitude: raw.longitude ? parseNum(raw.longitude) : undefined,
    destaque: Boolean(raw.destaque ?? raw.publicar),
    publicado_em: raw.publicado_em ?? raw.criado_em ?? undefined,
    atualizado_em: raw.atualizado_em ?? undefined,
    corretor_id: raw.corretor_id ? String(raw.corretor_id) : undefined,
    corretor_nome: raw.corretor_nome ?? undefined,
    corretor_foto: raw.corretor_foto ?? undefined,
    corretor_creci: raw.corretor_creci ?? undefined,
    corretor_whatsapp: raw.corretor_whatsapp ?? undefined,
  }
}

// Normalise a Supremo empreendimento record to our Property shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEmpreendimento(raw: Record<string, any>) {
  return {
    id: String(raw.id ?? ''),
    codigo: raw.codigo ?? String(raw.id ?? ''),
    titulo: raw.nome ?? '',
    tipo: 'Empreendimento',
    subtipo: raw.nome_tipo ?? undefined,
    finalidade: mapFinalidade(raw.finalidade),
    preco: parseNum(raw.preco),
    bairro: raw.brasil_bairro ?? '',
    cidade: raw.brasil_cidade ?? '',
    estado: raw.brasil_estado_uf ?? '',
    cep: raw.cep || undefined,
    endereco: raw.endereco || undefined,
    numero: raw.numero || undefined,
    complemento: raw.complemento || undefined,
    area_total: parseArea(raw.area_total),
    area_util: parseArea(raw.area_privativa),
    quartos: parseNum(raw.quartos),
    banheiros: parseNum(raw.banheiros),
    vagas: parseNum(raw.garagens),
    descricao: raw.descricao ?? '',
    fotos: Array.isArray(raw.fotos) ? raw.fotos : [],
    latitude: raw.latitude ? parseNum(raw.latitude) : undefined,
    longitude: raw.longitude ? parseNum(raw.longitude) : undefined,
    destaque: raw.publicar === 1 || raw.publicar === true,
    publicado_em: raw.data_entrega && raw.data_entrega !== '0000-00-00'
      ? raw.data_entrega
      : undefined,
    estagio_obra: raw.estagio_obra ?? undefined,
    construtora_nome: raw.construtora_nome ?? undefined,
    mcmv: raw.mcmv === 1,
  }
}

// Normalise the Supremo paginated list response to our PropertyListResponse shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeListResponse(raw: Record<string, any>, isEmpreendimento: boolean) {
  const page = Number(raw.paginaAtual ?? raw.pagina_atual ?? 1)
  const limit = Number(raw.porPagina ?? raw.por_pagina ?? 12)
  const total = Number(raw.total ?? 0)
  const pages = Number((raw.totalPaginas ?? raw.total_paginas) ?? (Math.ceil(total / limit) || 0))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: Record<string, any>[] = Array.isArray(raw.data) ? raw.data : []
  const data = items.map((item) =>
    isEmpreendimento ? normalizeEmpreendimento(item) : normalizeImovel(item)
  )

  return { data, total, page, limit, pages }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Try again in 1 minute.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const resource = url.searchParams.get('resource')

  if (!resource) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameter: resource' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Validate resource to prevent path traversal
  const validResources = /^(imoveis|empreendimentos)(\/[\w-]+)?$/
  if (!validResources.test(resource)) {
    return new Response(
      JSON.stringify({ error: 'Invalid resource' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const isDetail = /\/.+$/.test(resource)
  const isEmpreendimento = resource.startsWith('empreendimentos')

  // Check cache for detail requests
  if (isDetail) {
    const externalId = resource.replace('/', '_')
    const { data: cached } = await supabase
      .from('properties_cache')
      .select('data, expires_at')
      .eq('external_id', externalId)
      .single()

    if (cached && new Date(cached.expires_at) > new Date()) {
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      )
    }
  }

  // Fetch from SupremoCRM
  const supremoUrl = buildSupremoUrl(resource, url.searchParams)

  let supremoRes: Response
  try {
    supremoRes = await fetch(supremoUrl, {
      headers: {
        'Authorization': `Bearer ${SUPREMO_JWT}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
  } catch (err) {
    console.error('SupremoCRM fetch error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to connect to property service' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!supremoRes.ok) {
    console.error(`SupremoCRM error: ${supremoRes.status} ${supremoRes.statusText}`)
    return new Response(
      JSON.stringify({ error: `Property service error: ${supremoRes.status}` }),
      { status: supremoRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await supremoRes.json() as Record<string, any>

  // Normalise response
  let normalized: unknown
  if (isDetail) {
    normalized = isEmpreendimento ? normalizeEmpreendimento(raw) : normalizeImovel(raw)
  } else {
    normalized = normalizeListResponse(raw, isEmpreendimento)
  }

  // Cache detail results (2h TTL)
  if (isDetail && normalized) {
    const externalId = resource.replace('/', '_')
    const type = isEmpreendimento ? 'empreendimento' : 'imovel'
    await supabase
      .from('properties_cache')
      .upsert({
        external_id: externalId,
        type,
        data: normalized,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'external_id' })
  }

  return new Response(
    JSON.stringify(normalized),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
})
