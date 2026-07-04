import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Property } from '@/types/property'
import {
  detectKind,
  normalizeClaivorItem,
  type ClaivorFeed,
  type ClaivorFeedItem,
  type ClaivorItemKind,
} from '@/lib/feed/claivor'
import { jitterCoords } from '@/lib/recife-geo'

/**
 * Importa imóveis e empreendimentos do feed JSON do ClaivorCRM para
 * `properties_cache`, no mesmo formato `Property` que o supremo-proxy e o
 * seed produzem — o front (src/lib/properties.ts) já sabe ler essa tabela.
 *
 * Auth: `Authorization: Bearer <FEED_IMPORT_SECRET>` (ou CRON_SECRET, que o
 * Vercel Cron injeta automaticamente quando configurado no projeto).
 *
 * Convenções de gravação:
 *   • external_id = `claivor_<codigo>`
 *   • type        = 'imovel' | 'empreendimento'
 *   • expires_at  = agora + 10 anos — o feed é fonte de verdade, não um cache
 *     com TTL. A RLS `public_read_active_cache` esconde linhas expiradas do
 *     front, então um expires_at curto sumiria com os imóveis.
 *   • itens que saíram do feed são removidos da tabela (delete por prefixo)
 *   • mudanças de preço são registradas em `property_price_history`
 */

const EXTERNAL_ID_PREFIX = 'claivor_'
const FEED_TIMEOUT_MS = 30_000
const EXPIRES_MS = 10 * 365 * 24 * 60 * 60 * 1000

// ── Geocodificação (Nominatim/OSM) ──────────────────────────────────────────
// O feed Claivor não traz lat/lng nem endereço — só bairro/cidade/UF. Para o
// mapa funcionar em QUALQUER região, geocodificamos o centro do bairro na
// importação e gravamos em Property.latitude/longitude (geo_aproximado=true,
// com jitter determinístico p/ imóveis do mesmo bairro não empilharem).
// Coordenadas já resolvidas em importações anteriores são reaproveitadas
// (mesmo bairro/cidade ⇒ zero requests), então o custo do Nominatim é
// basicamente só na primeira vez que um bairro novo aparece no feed.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
// Política do Nominatim: máx. 1 request/segundo, com User-Agent identificado.
const GEOCODE_DELAY_MS = 1100
// Teto por execução p/ caber no maxDuration — o que ficar de fora resolve na
// próxima rodada do cron (o cache incremental garante convergência).
const GEOCODE_MAX_LOOKUPS = 12

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function geocodePlace(
  bairro: string,
  cidade: string,
  uf: string,
): Promise<[number, number] | null> {
  // 1ª tentativa: bairro + cidade + UF; fallback: só cidade + UF (bairro
  // desconhecido do OSM ou com typo no feed).
  const queries = [
    [bairro, cidade, uf].filter(Boolean).join(', '),
    [cidade, uf].filter(Boolean).join(', '),
  ].filter((q, i, arr) => q.length > 0 && arr.indexOf(q) === i)

  for (const q of queries) {
    try {
      const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'moreja-site-import/1.0 (https://www.morejaimobiliaria.com.br)' },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      })
      if (res.ok) {
        const hits = (await res.json()) as { lat?: string; lon?: string }[]
        const hit = hits?.[0]
        if (hit?.lat && hit?.lon) {
          const lat = Number.parseFloat(hit.lat)
          const lng = Number.parseFloat(hit.lon)
          if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng]
        }
      }
    } catch (err) {
      console.warn(`[IMPORT_FEED] geocode falhou para "${q}":`, err)
    }
    await sleep(GEOCODE_DELAY_MS)
  }
  return null
}

function isAuthorized(req: NextRequest): boolean {
  const secrets = [process.env.FEED_IMPORT_SECRET, process.env.CRON_SECRET].filter(
    (s): s is string => typeof s === 'string' && s.length > 0,
  )
  if (secrets.length === 0) return false

  const auth = req.headers.get('authorization') ?? ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return token.length > 0 && secrets.includes(token)
}

interface ImportSummary {
  ok: boolean
  total: number
  imoveis: number
  empreendimentos: number
  inserted: number
  updated: number
  removed: number
  price_changes: number
  geocoded: number
  skipped: string[]
  duration_ms: number
}

async function runImport(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const feedUrl = process.env.CLAIVOR_FEED_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!feedUrl || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  const startedAt = Date.now()

  // 1. Busca o feed
  let feed: ClaivorFeed
  try {
    const res = await fetch(feedUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: 'feed_unavailable', status: res.status },
        { status: 502 },
      )
    }
    feed = (await res.json()) as ClaivorFeed
  } catch (err) {
    console.error('[IMPORT_FEED] falha ao buscar feed Claivor:', err)
    return NextResponse.json({ error: 'feed_fetch_failed' }, { status: 502 })
  }

  const imoveis = Array.isArray(feed.imoveis) ? feed.imoveis : []
  const empreendimentos = Array.isArray(feed.empreendimentos) ? feed.empreendimentos : []
  if (imoveis.length === 0 && empreendimentos.length === 0) {
    // Feed vazio provavelmente indica problema na origem — não apaga nada.
    return NextResponse.json({ error: 'feed_empty' }, { status: 422 })
  }

  // 2. Normaliza para o contrato Property
  const skipped: string[] = []
  // Map deduplica por external_id — codigo repetido no feed quebraria o
  // upsert em lote ("ON CONFLICT cannot affect row a second time").
  const rowsById = new Map<string, { external_id: string; type: ClaivorItemKind; property: Property }>()
  const sources: { items: ClaivorFeedItem[]; kind: ClaivorItemKind }[] = [
    { items: imoveis, kind: 'imovel' },
    { items: empreendimentos, kind: 'empreendimento' },
  ]
  for (const { items, kind } of sources) {
    for (const item of items) {
      if (!item || typeof item.codigo !== 'string' || item.codigo.trim() === '') {
        skipped.push(`item sem codigo (${item?.titulo ?? 'sem título'})`)
        continue
      }
      const externalId = `${EXTERNAL_ID_PREFIX}${item.codigo}`
      if (rowsById.has(externalId)) {
        skipped.push(`codigo duplicado no feed (${item.codigo})`)
        continue
      }
      const resolvedKind = detectKind(item, kind)
      rowsById.set(externalId, {
        external_id: externalId,
        type: resolvedKind,
        property: normalizeClaivorItem(item, resolvedKind, feed.gerado_em),
      })
    }
  }
  const rows = [...rowsById.values()]

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 3. Estado anterior (para diff de preço e remoção de itens que saíram)
  const { data: existing, error: existingErr } = await supabase
    .from('properties_cache')
    .select('external_id, data')
    .like('external_id', `${EXTERNAL_ID_PREFIX}%`)
  if (existingErr) {
    console.error('[IMPORT_FEED] erro lendo properties_cache:', existingErr)
    return NextResponse.json({ error: 'db_read_failed' }, { status: 500 })
  }

  const previousById = new Map<string, Property>(
    (existing ?? []).map((row) => [row.external_id as string, row.data as Property]),
  )

  // 4. Geocodificação (centro do bairro) para o mapa — qualquer região.
  //    Ordem de resolução por imóvel sem lat/lng:
  //      a) coords da importação anterior, se bairro/cidade não mudaram;
  //      b) cache local por bairro|cidade|uf (imóveis do mesmo bairro
  //         compartilham 1 lookup);
  //      c) Nominatim (limitado a GEOCODE_MAX_LOOKUPS por execução).
  const geoCache = new Map<string, [number, number] | null>()
  let geocodeLookups = 0
  let geocoded = 0
  for (const r of rows) {
    const p = r.property
    if (typeof p.latitude === 'number' && typeof p.longitude === 'number') continue

    const prev = previousById.get(r.external_id)
    if (
      prev &&
      typeof prev.latitude === 'number' &&
      typeof prev.longitude === 'number' &&
      (prev.bairro ?? '') === (p.bairro ?? '') &&
      (prev.cidade ?? '') === (p.cidade ?? '')
    ) {
      p.latitude = prev.latitude
      p.longitude = prev.longitude
      p.geo_aproximado = prev.geo_aproximado ?? true
      continue
    }

    if (!p.bairro && !p.cidade) continue
    const placeKey = `${p.bairro ?? ''}|${p.cidade ?? ''}|${p.estado ?? ''}`.toLowerCase()
    if (!geoCache.has(placeKey)) {
      if (geocodeLookups >= GEOCODE_MAX_LOOKUPS) {
        skipped.push(`geocode adiado p/ próxima rodada (${placeKey})`)
        continue
      }
      geocodeLookups++
      geoCache.set(placeKey, await geocodePlace(p.bairro ?? '', p.cidade ?? '', p.estado ?? ''))
    }
    const coords = geoCache.get(placeKey)
    if (!coords) continue

    // Jitter determinístico (~150m) por código: imóveis do mesmo bairro não
    // empilham no mesmo pixel e o ponto é estável entre importações.
    const [lat, lng] = jitterCoords(coords, p.codigo)
    p.latitude = lat
    p.longitude = lng
    p.geo_aproximado = true
    geocoded++
  }

  // 5. Upsert em lote
  const now = new Date()
  const expiresAt = new Date(now.getTime() + EXPIRES_MS).toISOString()
  const { error: upsertErr } = await supabase.from('properties_cache').upsert(
    rows.map((r) => ({
      external_id: r.external_id,
      type: r.type,
      data: r.property,
      cached_at: now.toISOString(),
      expires_at: expiresAt,
    })),
    { onConflict: 'external_id' },
  )
  if (upsertErr) {
    console.error('[IMPORT_FEED] erro no upsert:', upsertErr)
    return NextResponse.json({ error: 'db_write_failed' }, { status: 500 })
  }

  // 6. Histórico de preço (primeira importação e mudanças)
  const priceRows = rows
    .filter((r) => {
      const prev = previousById.get(r.external_id)
      return r.property.preco > 0 && (!prev || prev.preco !== r.property.preco)
    })
    .map((r) => ({
      property_id: r.property.codigo,
      price: r.property.preco,
      finalidade: r.property.finalidade,
    }))
  if (priceRows.length > 0) {
    const { error: priceErr } = await supabase.from('property_price_history').insert(priceRows)
    if (priceErr) {
      // Não é fatal para a importação — só loga.
      console.error('[IMPORT_FEED] erro gravando property_price_history:', priceErr)
    }
  }

  // 7. Remove itens que saíram do feed
  const currentIds = new Set(rows.map((r) => r.external_id))
  const staleIds = [...previousById.keys()].filter((id) => !currentIds.has(id))
  if (staleIds.length > 0) {
    const { error: deleteErr } = await supabase
      .from('properties_cache')
      .delete()
      .in('external_id', staleIds)
    if (deleteErr) {
      console.error('[IMPORT_FEED] erro removendo itens obsoletos:', deleteErr)
    }
  }

  // 8. Revalida as páginas que listam/exibem imóveis
  for (const path of ['/', '/comprar', '/alugar', '/empreendimentos']) {
    revalidatePath(path)
  }
  revalidatePath('/imovel/[id]', 'page')
  revalidatePath('/empreendimentos/[id]', 'page')

  const inserted = rows.filter((r) => !previousById.has(r.external_id)).length
  const summary: ImportSummary = {
    ok: true,
    total: rows.length,
    imoveis: rows.filter((r) => r.type === 'imovel').length,
    empreendimentos: rows.filter((r) => r.type === 'empreendimento').length,
    inserted,
    updated: rows.length - inserted,
    removed: staleIds.length,
    price_changes: priceRows.length,
    geocoded,
    skipped,
    duration_ms: Date.now() - startedAt,
  }
  console.log('[IMPORT_FEED] importação concluída:', JSON.stringify(summary))
  return NextResponse.json(summary)
}

// POST para chamadas manuais/integrações; GET para o Vercel Cron.
export async function POST(req: NextRequest) {
  return runImport(req)
}

export async function GET(req: NextRequest) {
  return runImport(req)
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Feeds grandes + rehost de dados podem passar do default de 15s no Vercel.
export const maxDuration = 60
