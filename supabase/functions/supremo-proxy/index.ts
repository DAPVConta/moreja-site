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

// Supremo photo records use `url_foto_g` (large), `url_foto_p` (small) or
// `url_foto_externa` for externally hosted images. Prefer the large one.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPhotoUrl(foto: Record<string, any>): string | null {
  const candidates = [foto.url_foto_g, foto.url_foto_p, foto.url_foto_externa]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVideoUrl(video: Record<string, any>): string | null {
  const candidates = [video.url, video.link, video.youtube, video.vimeo, video.src]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c
  }
  return null
}

async function supremoGet(path: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${SUPREMO_API_URL}/${path}`, {
      headers: {
        'Authorization': `Bearer ${SUPREMO_JWT}`,
        'Accept': 'application/json',
      },
    })
    if (!res.ok) return null
    return await res.json() as Record<string, unknown>
  } catch (err) {
    console.error(`supremoGet(${path}) error:`, err)
    return null
  }
}

// Imóveis: photos live at /imoveis/:id/fotos (flat list, ordered by `ordem`).
async function fetchImovelPhotos(id: string): Promise<string[]> {
  const payload = await supremoGet(`imoveis/${id}/fotos?por_pagina=100`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: Record<string, any>[] = Array.isArray(payload?.data) ? (payload!.data as Record<string, any>[]) : []
  items.sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0))
  return items.map(extractPhotoUrl).filter((u): u is string => !!u)
}

// Empreendimentos: photos are nested under galerias — need two hops.
//   /empreendimentos/:id/galerias               → list galleries
//   /empreendimentos/:id/galerias/:gid/fotos    → photos of each gallery
async function fetchEmpreendimentoPhotos(id: string): Promise<string[]> {
  const payload = await supremoGet(`empreendimentos/${id}/galerias?por_pagina=100`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galerias: Record<string, any>[] = Array.isArray(payload?.data) ? (payload!.data as Record<string, any>[]) : []
  if (galerias.length === 0) return []

  const perGallery = await Promise.all(
    galerias.map(async (g) => {
      const gid = g.id
      if (gid === undefined || gid === null) return [] as string[]
      const p = await supremoGet(`empreendimentos/${id}/galerias/${gid}/fotos?por_pagina=100`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fotos: Record<string, any>[] = Array.isArray(p?.data) ? (p!.data as Record<string, any>[]) : []
      fotos.sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0))
      return fotos.map(extractPhotoUrl).filter((u): u is string => !!u)
    })
  )
  return perGallery.flat()
}

async function fetchPhotos(resource: 'imoveis' | 'empreendimentos', id: string): Promise<string[]> {
  return resource === 'empreendimentos'
    ? fetchEmpreendimentoPhotos(id)
    : fetchImovelPhotos(id)
}

// Videos: only /empreendimentos/:id/videos is known to exist.
async function fetchVideoUrls(resource: 'imoveis' | 'empreendimentos', id: string): Promise<string[]> {
  if (resource !== 'empreendimentos') return []
  const payload = await supremoGet(`empreendimentos/${id}/videos?por_pagina=100`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: Record<string, any>[] = Array.isArray(payload?.data) ? (payload!.data as Record<string, any>[]) : []
  return items.map(extractVideoUrl).filter((u): u is string => !!u)
}

// Supremo expects `finalidade` as a number (1=Venda, 2=Locação, 3=ambos).
// The site sends it as a string, so we translate.
function finalidadeToNumber(v: string): string | null {
  const n = v.toLowerCase()
  if (n === 'venda' || v === '1') return '1'
  if (n === 'locação' || n === 'locacao' || v === '2') return '2'
  if (n.includes('venda') && n.includes('loca') || v === '3') return '3'
  return null
}

function buildSupremoUrl(resource: string, params: URLSearchParams): string {
  const supremoParams = new URLSearchParams()

  // Param mapping: app names → Supremo API names
  const paramMap: Record<string, string> = {
    page: 'pagina',
    limit: 'por_pagina',
    tipo: 'tipo',
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

  // finalidade requires string→number translation
  const finalidade = params.get('finalidade')
  if (finalidade) {
    const num = finalidadeToNumber(finalidade)
    if (num) supremoParams.set('finalidade', num)
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

// Normalise a Supremo imovel record to our Property shape.
// Supremo field names (from observed payloads):
//   nome, valor, numero_quartos, numero_banheiros, numero_garagens, numero_suites,
//   condominio_mensal, iptu_mensal, brasil_*, situacao, finalidade, url_foto_g/p,
//   url_360, youtube, data_cadastro, data_edicao, id_captador, captador_nome,
//   captador_email, captador_ddd, captador_telefone.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeImovel(raw: Record<string, any>) {
  const coverPhoto = raw.url_foto_g || raw.url_foto_p
  const captadorPhone = [raw.captador_ddd, raw.captador_telefone]
    .filter((p) => p !== null && p !== undefined && String(p).length > 0)
    .join('')
  return {
    id: String(raw.id ?? ''),
    codigo: raw.codigo_interno || String(raw.id ?? ''),
    titulo: raw.nome ?? '',
    tipo: raw.tipo ?? '',
    subtipo: raw.tipo ?? undefined,
    finalidade: mapFinalidade(raw.finalidade),
    preco: parseNum(raw.valor),
    preco_condominio: raw.condominio_mensal ? parseNum(raw.condominio_mensal) : undefined,
    preco_iptu: raw.iptu_mensal ? parseNum(raw.iptu_mensal) : undefined,
    bairro: raw.brasil_bairro ?? raw.internacional_bairro ?? '',
    cidade: raw.brasil_cidade ?? raw.internacional_cidade ?? '',
    estado: raw.brasil_estado_uf ?? raw.internacional_estado ?? '',
    cep: raw.cep || undefined,
    endereco: raw.endereco || undefined,
    numero: raw.numero || undefined,
    complemento: raw.complemento || undefined,
    area_total: parseArea(raw.area_total),
    area_util: parseArea(raw.area_util) || parseArea(raw.area_privativa),
    area_terreno: raw.area_construida ? parseArea(raw.area_construida) : undefined,
    quartos: parseNum(raw.numero_quartos),
    suites: raw.numero_suites ? parseNum(raw.numero_suites) : undefined,
    banheiros: parseNum(raw.numero_banheiros),
    vagas: parseNum(raw.numero_garagens),
    descricao: raw.descricao ?? '',
    // Cover photo is embedded in the list payload; full gallery is fetched later.
    fotos: coverPhoto ? [coverPhoto] : [],
    video_url: raw.youtube || undefined,
    tour_virtual: raw.url_360 || undefined,
    latitude: raw.latitude ? parseNum(raw.latitude) : undefined,
    longitude: raw.longitude ? parseNum(raw.longitude) : undefined,
    destaque: raw.fl_exibir_tarja === 1,
    publicado_em: raw.data_cadastro ?? undefined,
    atualizado_em: raw.data_edicao ?? undefined,
    corretor_id: raw.id_captador ? String(raw.id_captador) : undefined,
    corretor_nome: raw.captador_nome ?? undefined,
    corretor_whatsapp: captadorPhone || undefined,
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

// Only published items are allowed on the site.
// Supremo uses different flags for each resource:
//   - Empreendimentos: `publicar === 1`
//   - Imóveis:         `publicado === "Sim"` (string) — may also come as 1/true
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPublished(raw: Record<string, any>): boolean {
  const pubImovel = raw.publicado
  if (pubImovel === 'Sim' || pubImovel === 1 || pubImovel === '1' || pubImovel === true) return true
  const pubEmp = raw.publicar
  if (pubEmp === 1 || pubEmp === '1' || pubEmp === true) return true
  return false
}

// Normalise the Supremo paginated list response to our PropertyListResponse shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeListResponse(raw: Record<string, any>, isEmpreendimento: boolean) {
  const page = Number(raw.paginaAtual ?? raw.pagina_atual ?? 1)
  const limit = Number(raw.porPagina ?? raw.por_pagina ?? 12)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: Record<string, any>[] = Array.isArray(raw.data) ? raw.data : []
  const published = items.filter(isPublished)
  const data = published.map((item) =>
    isEmpreendimento ? normalizeEmpreendimento(item) : normalizeImovel(item)
  )

  // Upstream totals include unpublished items, so we report counts based on
  // what we actually return for this page.
  const total = published.length
  const pages = total > 0 ? Math.max(1, Math.ceil(total / limit)) : 0

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

  // For detail requests, block access to unpublished items.
  if (isDetail && !isPublished(raw)) {
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Normalise response
  const mediaResource = isEmpreendimento ? 'empreendimentos' : 'imoveis'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let normalized: any
  if (isDetail) {
    normalized = isEmpreendimento ? normalizeEmpreendimento(raw) : normalizeImovel(raw)
    // Enrich with photos + first video URL (best-effort, parallel)
    const id = String(raw.id ?? '')
    const [fotos, videos] = await Promise.all([
      fetchPhotos(mediaResource, id),
      fetchVideoUrls(mediaResource, id),
    ])
    if (fotos.length > 0) normalized.fotos = fotos
    if (videos.length > 0) normalized.video_url = videos[0]
  } else {
    const list = normalizeListResponse(raw, isEmpreendimento)
    // Enrich each item in the list with its cover photo(s).
    // Fetched in parallel to keep latency low.
    const enriched = await Promise.all(
      list.data.map(async (item) => {
        if (item.fotos && item.fotos.length > 0) return item
        const fotos = await fetchPhotos(mediaResource, item.id)
        return fotos.length > 0 ? { ...item, fotos } : item
      })
    )
    normalized = { ...list, data: enriched }
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
