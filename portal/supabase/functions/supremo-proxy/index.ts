import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const SUPREMO_JWT = Deno.env.get('SUPREMO_JWT')!
const SUPREMO_API_URL = Deno.env.get('SUPREMO_API_URL') ?? 'https://api.supremocrm.com.br'
const SUPREMO_SIT_ID = Deno.env.get('SUPREMO_SIT_ID') ?? '881'
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
  supremoParams.set('sit_id', SUPREMO_SIT_ID)

  const allowedParams = ['page', 'limit', 'tipo', 'finalidade', 'bairro', 'cidade',
    'preco_min', 'preco_max', 'area_min', 'area_max', 'quartos', 'q', 'order']

  for (const key of allowedParams) {
    const value = params.get(key)
    if (value) supremoParams.set(key, value)
  }

  return `${SUPREMO_API_URL}/${resource}?${supremoParams.toString()}`
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

  // Check cache for detail requests
  const isDetail = /\/.+$/.test(resource)
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

  const data = await supremoRes.json()

  // Cache detail results
  if (isDetail && data) {
    const externalId = resource.replace('/', '_')
    const type = resource.startsWith('imoveis') ? 'imovel' : 'empreendimento'
    await supabase
      .from('properties_cache')
      .upsert({
        external_id: externalId,
        type,
        data,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'external_id' })
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
  )
})
