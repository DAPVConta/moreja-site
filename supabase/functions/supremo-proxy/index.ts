import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://moreja.com.br,https://www.moreja.com.br')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allow =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https:\/\/[a-z0-9-]+(\.dapvcontas-projects)?\.vercel\.app$/i.test(origin)
      ? origin
      : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Vary': 'Origin',
  }
}

const SUPREMO_JWT = Deno.env.get('SUPREMO_JWT')!
const SUPREMO_API_URL = Deno.env.get('SUPREMO_API_URL') ?? 'https://api.supremocrm.com.br/v1'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ─────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────
const TIMEOUT_MS = 8_000
const RETRY_DELAYS_MS = [250, 500, 1_500] // exponential-ish backoff p/ 5xx/timeout
const RATE_LIMIT = 100
const RATE_WINDOW_MS = 60_000
const TTL_DETAIL_MS = 2 * 60 * 60 * 1000  // 2h — alinhado com properties_cache.expires_at default
const TTL_LIST_MS = 10 * 60 * 1000         // 10min — listas mudam mais frequentemente
const STALE_TOLERANCE_MS = 24 * 60 * 60 * 1000 // 24h — janela máxima p/ stale-on-error

// In-memory rate limit (best-effort; sobrevive entre cold starts apenas
// dentro da mesma instância). Para garantia total, mover p/ tabela
// `supremo_rate_limit` no Supabase — TODO bloco 9.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

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

// ─────────────────────────────────────────────────────────────────────────
// PHOTO/VIDEO HELPERS
// ─────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPhotoUrl(foto: Record<string, any>): string | null {
  const candidates = [foto.url_foto_g, foto.url_foto_p, foto.url_foto_externa]
  for (const c of candidates) if (typeof c === 'string' && c.length > 0) return c
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVideoUrl(video: Record<string, any>): string | null {
  const candidates = [video.url, video.link, video.youtube, video.vimeo, video.src]
  for (const c of candidates) if (typeof c === 'string' && c.length > 0) return c
  return null
}

// ─────────────────────────────────────────────────────────────────────────
// HTTP helpers — retry + timeout
// ─────────────────────────────────────────────────────────────────────────

async function fetchWithRetry(url: string, init: RequestInit = {}): Promise<Response> {
  let lastError: unknown = null
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(timeout)

      // Retry só em 5xx (não em 4xx — esses são bugs do client)
      if (res.status >= 500 && res.status < 600 && attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]))
        continue
      }
      return res
    } catch (err) {
      clearTimeout(timeout)
      lastError = err
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]))
        continue
      }
      throw err
    }
  }
  throw lastError ?? new Error('fetchWithRetry: exhausted')
}

async function supremoGet(path: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetchWithRetry(`${SUPREMO_API_URL}/${path}`, {
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

// ─────────────────────────────────────────────────────────────────────────
// PHOTO FETCHERS (cached separately to avoid N+1 list refetch)
// ─────────────────────────────────────────────────────────────────────────

async function fetchImovelPhotos(id: string): Promise<string[]> {
  const payload = await supremoGet(`imoveis/${id}/fotos?por_pagina=100`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: Record<string, any>[] = Array.isArray(payload?.data) ? (payload!.data as Record<string, any>[]) : []
  items.sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0))
  return items.map(extractPhotoUrl).filter((u): u is string => !!u)
}

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

async function fetchVideoUrls(resource: 'imoveis' | 'empreendimentos', id: string): Promise<string[]> {
  if (resource !== 'empreendimentos') return []
  const payload = await supremoGet(`empreendimentos/${id}/videos?por_pagina=100`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: Record<string, any>[] = Array.isArray(payload?.data) ? (payload!.data as Record<string, any>[]) : []
  return items.map(extractVideoUrl).filter((u): u is string => !!u)
}

// ─────────────────────────────────────────────────────────────────────────
// SUPREMO API param mapping
// ─────────────────────────────────────────────────────────────────────────

function finalidadeToNumber(v: string): string | null {
  const n = v.toLowerCase()
  if (n === 'venda' || v === '1') return '1'
  if (n === 'locação' || n === 'locacao' || v === '2') return '2'
  if ((n.includes('venda') && n.includes('loca')) || v === '3') return '3'
  return null
}

function buildSupremoUrl(resource: string, params: URLSearchParams): string {
  const supremoParams = new URLSearchParams()
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
    destaque: 'destaque',
  }
  for (const [appKey, supremoKey] of Object.entries(paramMap)) {
    const value = params.get(appKey)
    if (value) supremoParams.set(supremoKey, value)
  }
  const finalidade = params.get('finalidade')
  if (finalidade) {
    const num = finalidadeToNumber(finalidade)
    if (num) supremoParams.set('finalidade', num)
  }
  return `${SUPREMO_API_URL}/${resource}?${supremoParams.toString()}`
}

// ─────────────────────────────────────────────────────────────────────────
// NORMALIZERS (mantidos do original)
// ─────────────────────────────────────────────────────────────────────────

function mapFinalidade(f: number | string | null): 'Venda' | 'Locação' | 'Venda e Locação' {
  const n = Number(f)
  if (n === 2) return 'Locação'
  if (n === 3) return 'Venda e Locação'
  return 'Venda'
}

function parseNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function parseArea(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  const cleaned = String(v).replace(/[^\d.,]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

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
    ano_construcao: raw.ano_construcao ?? undefined,
    pet_friendly: raw.aceita_pets === 1 || raw.aceita_pets === true || undefined,
  }
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPublished(raw: Record<string, any>): boolean {
  const pubImovel = raw.publicado
  if (pubImovel === 'Sim' || pubImovel === 1 || pubImovel === '1' || pubImovel === true) return true
  const pubEmp = raw.publicar
  if (pubEmp === 1 || pubEmp === '1' || pubEmp === true) return true
  return false
}

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
  const total = published.length
  const pages = total > 0 ? Math.max(1, Math.ceil(total / limit)) : 0
  return { data, total, page, limit, pages }
}

// ─────────────────────────────────────────────────────────────────────────
// Cache helpers (detail + list + photos separately)
// ─────────────────────────────────────────────────────────────────────────

interface SupabaseClient {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): {
        single(): Promise<{ data: { data: unknown; expires_at: string } | null }>
      }
    }
    upsert(row: Record<string, unknown>, opts: { onConflict: string }): Promise<unknown>
  }
}

async function readCache(
  supabase: SupabaseClient,
  externalId: string,
  staleAllowed = false
): Promise<{ data: unknown; cacheStatus: 'HIT' | 'STALE' } | null> {
  const { data: cached } = await supabase
    .from('properties_cache')
    .select('data, expires_at')
    .eq('external_id', externalId)
    .single()

  if (!cached) return null

  const now = Date.now()
  const expiresAt = new Date(cached.expires_at).getTime()

  if (expiresAt > now) {
    return { data: cached.data, cacheStatus: 'HIT' }
  }

  // Stale-on-error fallback: serve cached row past expires_at if upstream
  // fails — bound by STALE_TOLERANCE_MS.
  if (staleAllowed && now - expiresAt < STALE_TOLERANCE_MS) {
    return { data: cached.data, cacheStatus: 'STALE' }
  }
  return null
}

async function writeCache(
  supabase: SupabaseClient,
  externalId: string,
  type: string,
  data: unknown,
  ttlMs: number
) {
  await supabase.from('properties_cache').upsert(
    {
      external_id: externalId,
      type,
      data,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + ttlMs).toISOString(),
    },
    { onConflict: 'external_id' }
  )
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)

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

  // Validate resource (path traversal prevention)
  const validResources = /^(imoveis|empreendimentos)(\/[\w-]+(\/(unidades|tipologias))?)?$/
  if (!validResources.test(resource)) {
    return new Response(
      JSON.stringify({ error: 'Invalid resource' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) as any
  const isUnits = /\/(unidades|tipologias)$/.test(resource)
  const isDetail = !isUnits && /\/[^/]+$/.test(resource)
  const isList = !isUnits && !isDetail
  const isEmpreendimento = resource.startsWith('empreendimentos')

  // Cache key inclui query string p/ list (filtros distintos = caches distintos)
  const cacheKey = isList
    ? `list_${resource}_${[...url.searchParams.entries()]
        .filter(([k]) => k !== 'resource')
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')}`
    : isDetail
      ? resource.replace('/', '_')
      : null

  // Try fresh cache first
  if (cacheKey) {
    const fresh = await readCache(supabase, cacheKey)
    if (fresh) {
      return new Response(
        JSON.stringify(fresh.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': fresh.cacheStatus } }
      )
    }
  }

  // Fetch from SupremoCRM
  const supremoUrl = isUnits
    ? `${SUPREMO_API_URL}/${resource}?por_pagina=100`
    : buildSupremoUrl(resource, url.searchParams)

  let supremoRes: Response
  try {
    supremoRes = await fetchWithRetry(supremoUrl, {
      headers: {
        'Authorization': `Bearer ${SUPREMO_JWT}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
  } catch (err) {
    console.error('SupremoCRM fetch error (after retry):', err)
    // Stale-on-error
    if (cacheKey) {
      const stale = await readCache(supabase, cacheKey, true)
      if (stale) {
        return new Response(
          JSON.stringify(stale.data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'STALE' } }
        )
      }
    }
    return new Response(
      JSON.stringify({ error: 'Failed to connect to property service' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!supremoRes.ok) {
    console.error(`SupremoCRM error: ${supremoRes.status}`)
    if (cacheKey) {
      const stale = await readCache(supabase, cacheKey, true)
      if (stale) {
        return new Response(
          JSON.stringify(stale.data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'STALE' } }
        )
      }
    }
    return new Response(
      JSON.stringify({ error: `Property service error: ${supremoRes.status}` }),
      { status: supremoRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await supremoRes.json() as Record<string, any>

  // ─── UNITS (tipologias dos empreendimentos) ────────────────────────────
  if (isUnits) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: Record<string, any>[] = Array.isArray(raw.data) ? raw.data : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized = items.map((u: Record<string, any>) => ({
      id: String(u.id ?? ''),
      nome: u.nome ?? u.descricao ?? '',
      area: parseArea(u.area_privativa ?? u.area_total),
      quartos: parseNum(u.quartos ?? u.numero_quartos),
      suites: parseNum(u.suites ?? u.numero_suites),
      banheiros: parseNum(u.banheiros ?? u.numero_banheiros),
      vagas: parseNum(u.vagas ?? u.numero_garagens),
      preco: parseNum(u.preco ?? u.valor),
      planta_url: u.planta_url ?? u.url_planta ?? undefined,
    }))
    const result = { data: normalized, total: normalized.length }
    if (cacheKey) await writeCache(supabase, cacheKey, 'units', result, TTL_DETAIL_MS)
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    })
  }

  // ─── DETAIL ────────────────────────────────────────────────────────────
  if (isDetail) {
    if (!isPublished(raw)) {
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const mediaResource = isEmpreendimento ? 'empreendimentos' : 'imoveis'
    const normalized = isEmpreendimento ? normalizeEmpreendimento(raw) : normalizeImovel(raw)
    const id = String(raw.id ?? '')
    const [fotos, videos] = await Promise.all([
      fetchPhotos(mediaResource, id),
      fetchVideoUrls(mediaResource, id),
    ])
    if (fotos.length > 0) normalized.fotos = fotos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (videos.length > 0) (normalized as any).video_url = videos[0]

    if (cacheKey) {
      const type = isEmpreendimento ? 'empreendimento' : 'imovel'
      await writeCache(supabase, cacheKey, type, normalized, TTL_DETAIL_MS)
    }
    return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    })
  }

  // ─── LIST ──────────────────────────────────────────────────────────────
  const list = normalizeListResponse(raw, isEmpreendimento)
  const mediaResource = isEmpreendimento ? 'empreendimentos' : 'imoveis'

  // Enriquece fotos só dos itens sem cover (mantém in-flight com Promise.all)
  const enriched = await Promise.all(
    list.data.map(async (item) => {
      if (item.fotos && item.fotos.length > 0) return item
      const fotos = await fetchPhotos(mediaResource, item.id)
      return fotos.length > 0 ? { ...item, fotos } : item
    })
  )
  const result = { ...list, data: enriched }

  if (cacheKey) {
    const type = isEmpreendimento ? 'empreendimento_list' : 'imovel_list'
    await writeCache(supabase, cacheKey, type, result, TTL_LIST_MS)
  }

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
  })
})
