import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Allowlist (defina via env ALLOWED_ORIGINS=comma-separated; fallback ao
// domínio canonical + previews do Vercel)
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://moreja.com.br,https://www.moreja.com.br')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  // Permite domínio canonical, www, e subdomínios *.vercel.app (PR previews)
  const allow =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https:\/\/[a-z0-9-]+(\.dapvcontas-projects)?\.vercel\.app$/i.test(origin)
      ? origin
      : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPREMO_JWT = Deno.env.get('SUPREMO_JWT') ?? ''
const SUPREMO_API_URL = Deno.env.get('SUPREMO_API_URL') ?? 'https://api.supremocrm.com.br/v1'
const SUPREMO_SIT_ID = Deno.env.get('SUPREMO_SIT_ID') ?? ''

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitize(str: string | undefined | null, maxLen = 1000): string {
  if (!str) return ''
  return String(str).trim().slice(0, maxLen)
}

interface LeadInput {
  // Português (atual frontend) com fallback inglês (legacy)
  name?: string; nome?: string
  email?: string
  phone?: string; telefone?: string
  message?: string; mensagem?: string
  property_id?: string; imovel_id?: string
  property_title?: string; imovel_codigo?: string; imovel_titulo?: string
  source?: string; origem?: string
  // Tracking enrichment
  event_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  gclid?: string
  fbclid?: string
  fbp?: string
  fbc?: string
  ga_client_id?: string
  referrer?: string
  page_url?: string
  consent_lgpd?: boolean
}

/**
 * Hash IP/UA suaves p/ atender LGPD (não armazenar IP cleartext em leads).
 */
async function hashString(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

/**
 * Tenta criar oportunidade no Supremo. Retorna { ok, supremo_id, error }.
 * Não bloqueia o lead — chamado fire-and-forget após o save em Supabase.
 *
 * Endpoint Supremo (verificar com docs):
 *   POST /oportunidades
 *   Body: { nome, email, ddd, telefone, mensagem, id_imovel?, id_empreendimento?, origem, sit_id }
 */
async function pushToSupremo(lead: {
  name: string
  email: string
  phone: string
  message: string
  property_id: string
  source: string
  utm_source?: string
  utm_campaign?: string
}): Promise<{ ok: boolean; supremo_id?: string; error?: string }> {
  if (!SUPREMO_JWT) return { ok: false, error: 'supremo_jwt_missing' }

  // Splita telefone em DDD + número (Supremo costuma exigir)
  const digits = lead.phone.replace(/\D/g, '')
  let ddd = ''
  let telefone = digits
  if (digits.length >= 10) {
    // Considera DDI 55 prefixo opcional
    const start = digits.startsWith('55') && digits.length >= 12 ? 2 : 0
    ddd = digits.slice(start, start + 2)
    telefone = digits.slice(start + 2)
  }

  // property_id pode vir como código ("MOJ-1234") ou id numérico
  const isNumericId = /^\d+$/.test(lead.property_id)

  const body: Record<string, unknown> = {
    nome: lead.name,
    email: lead.email,
    ddd,
    telefone,
    mensagem: lead.message,
    origem: `site_moreja:${lead.source}`,
    sit_id: SUPREMO_SIT_ID || undefined,
  }
  if (lead.property_id) {
    if (isNumericId) {
      body.id_imovel = lead.property_id
    } else {
      body.codigo_imovel = lead.property_id
    }
  }
  if (lead.utm_source) body.utm_source = lead.utm_source
  if (lead.utm_campaign) body.utm_campaign = lead.utm_campaign

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${SUPREMO_API_URL}/oportunidades`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPREMO_JWT}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `${res.status}: ${text.slice(0, 200)}` }
    }
    const json = await res.json().catch(() => ({})) as { id?: string | number }
    return { ok: true, supremo_id: json.id != null ? String(json.id) : undefined }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown_error',
    }
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let body: LeadInput
  try {
    body = await req.json() as LeadInput
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const name = sanitize(body.name ?? body.nome, 200)
  const email = sanitize(body.email, 320)
  const phone = sanitize(body.phone ?? body.telefone, 40)
  const message = sanitize(body.message ?? body.mensagem, 5000)
  const property_id = sanitize(body.property_id ?? body.imovel_id, 100)
  const property_title = sanitize(
    body.property_title ?? body.imovel_codigo ?? body.imovel_titulo,
    300
  )
  const source = sanitize(body.source ?? body.origem, 100) || 'contato'

  // Tracking enrichment
  const event_id = sanitize(body.event_id, 100)
  const utm_source = sanitize(body.utm_source, 100)
  const utm_medium = sanitize(body.utm_medium, 100)
  const utm_campaign = sanitize(body.utm_campaign, 200)
  const utm_content = sanitize(body.utm_content, 200)
  const utm_term = sanitize(body.utm_term, 200)
  const gclid = sanitize(body.gclid, 200)
  const fbclid = sanitize(body.fbclid, 200)
  const fbp = sanitize(body.fbp, 200)
  const fbc = sanitize(body.fbc, 200)
  const ga_client_id = sanitize(body.ga_client_id, 100)
  const referrer = sanitize(body.referrer, 500)
  const page_url = sanitize(body.page_url, 500)
  const consent_lgpd = body.consent_lgpd === true

  // Validation
  if (!name) {
    return new Response(
      JSON.stringify({ error: 'Nome é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  if (!email || !isValidEmail(email)) {
    return new Response(
      JSON.stringify({ error: 'E-mail inválido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Hash IP/UA p/ LGPD
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
                ?? req.headers.get('x-real-ip') ?? ''
  const userAgent = sanitize(req.headers.get('user-agent') ?? '', 500)
  const ip_hash = rawIp ? await hashString(rawIp) : null

  // 1) Persist lead em Supabase (source of truth)
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name, email, phone, message, property_id, property_title, source,
      event_id: event_id || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      utm_term: utm_term || null,
      gclid: gclid || null,
      fbclid: fbclid || null,
      fbp: fbp || null,
      fbc: fbc || null,
      ga_client_id: ga_client_id || null,
      referrer: referrer || null,
      page_url: page_url || null,
      ip_hash,
      user_agent: userAgent || null,
      consent_lgpd,
      supremo_status: 'pending',
      supremo_attempts: 0,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Lead insert error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao salvar contato. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // 2) Fire-and-await POST p/ Supremo. Limite de timeout pequeno (6s) — se
  //    falhar, marcamos retry e o pg_cron / função supremo-retry pega depois.
  const supremoResult = await pushToSupremo({
    name, email, phone, message, property_id, source,
    utm_source, utm_campaign,
  })

  // 3) Atualiza lead com resultado da sync
  await supabase
    .from('leads')
    .update({
      supremo_id: supremoResult.supremo_id ?? null,
      supremo_status: supremoResult.ok ? 'synced' : 'retry',
      supremo_attempts: 1,
      supremo_last_error: supremoResult.error ?? null,
      supremo_synced_at: supremoResult.ok ? new Date().toISOString() : null,
    })
    .eq('id', data.id)

  return new Response(
    JSON.stringify({
      success: true,
      id: data.id,
      supremo: supremoResult.ok ? 'synced' : 'queued_for_retry',
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
