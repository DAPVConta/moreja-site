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

  // 4. Upsert em lote
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

  // 5. Histórico de preço (primeira importação e mudanças)
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

  // 6. Remove itens que saíram do feed
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

  // 7. Revalida as páginas que listam/exibem imóveis
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
