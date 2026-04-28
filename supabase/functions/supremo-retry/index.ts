import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * supremo-retry — worker invocado pelo pg_cron a cada 5 minutos.
 *
 *   • Lê leads onde supremo_status IN ('pending', 'retry') AND attempts < 5
 *   • Reenvia POST /oportunidades pro Supremo
 *   • Backoff implícito: rodar a cada 5min naturalmente espaça as tentativas
 *   • Após 5 attempts, marca supremo_status='failed' e desiste
 *
 * Auth: precisa do service_role JWT (configurar como secret SUPABASE_SERVICE_ROLE_KEY
 * via supabase functions secrets) — pg_cron chama a function via supabase.functions
 * passando essa auth.
 *
 * Parâmetros opcionais (POST body):
 *   { batch_size?: number = 10, lead_id?: string }
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPREMO_JWT = Deno.env.get('SUPREMO_JWT') ?? ''
const SUPREMO_API_URL = Deno.env.get('SUPREMO_API_URL') ?? 'https://api.supremocrm.com.br/v1'
const SUPREMO_SIT_ID = Deno.env.get('SUPREMO_SIT_ID') ?? ''

const MAX_ATTEMPTS = 5

interface LeadRow {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  property_id: string | null
  source: string
  utm_source: string | null
  utm_campaign: string | null
  supremo_attempts: number
}

async function pushOne(lead: LeadRow): Promise<{ ok: boolean; supremo_id?: string; error?: string }> {
  if (!SUPREMO_JWT) return { ok: false, error: 'supremo_jwt_missing' }

  const phoneDigits = (lead.phone ?? '').replace(/\D/g, '')
  let ddd = ''
  let telefone = phoneDigits
  if (phoneDigits.length >= 10) {
    const start = phoneDigits.startsWith('55') && phoneDigits.length >= 12 ? 2 : 0
    ddd = phoneDigits.slice(start, start + 2)
    telefone = phoneDigits.slice(start + 2)
  }

  const isNumericId = lead.property_id && /^\d+$/.test(lead.property_id)
  const body: Record<string, unknown> = {
    nome: lead.name,
    email: lead.email,
    ddd,
    telefone,
    mensagem: lead.message ?? '',
    origem: `site_moreja:${lead.source}`,
    sit_id: SUPREMO_SIT_ID || undefined,
  }
  if (lead.property_id) {
    if (isNumericId) body.id_imovel = lead.property_id
    else body.codigo_imovel = lead.property_id
  }
  if (lead.utm_source) body.utm_source = lead.utm_source
  if (lead.utm_campaign) body.utm_campaign = lead.utm_campaign

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
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
      return { ok: false, error: `${res.status}: ${text.slice(0, 300)}` }
    }
    const json = await res.json().catch(() => ({})) as { id?: string | number }
    return { ok: true, supremo_id: json.id != null ? String(json.id) : undefined }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown_error' }
  }
}

Deno.serve(async (req: Request) => {
  // Auth gate: só aceita chamadas com service_role
  const authHeader = req.headers.get('authorization') ?? ''
  if (!authHeader.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let params: { batch_size?: number; lead_id?: string } = {}
  if (req.method === 'POST') {
    try { params = await req.json() } catch { /* ignore */ }
  }

  const batchSize = Math.min(Math.max(params.batch_size ?? 10, 1), 50)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let query = supabase
    .from('leads')
    .select('id, name, email, phone, message, property_id, source, utm_source, utm_campaign, supremo_attempts')
    .in('supremo_status', ['pending', 'retry'])
    .lt('supremo_attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(batchSize)

  if (params.lead_id) query = query.eq('id', params.lead_id)

  const { data: leads, error } = await query
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results: Array<{ id: string; status: string; supremo_id?: string }> = []

  for (const lead of (leads ?? []) as LeadRow[]) {
    const result = await pushOne(lead)
    const newAttempts = lead.supremo_attempts + 1
    const status =
      result.ok ? 'synced' :
      newAttempts >= MAX_ATTEMPTS ? 'failed' :
      'retry'

    await supabase
      .from('leads')
      .update({
        supremo_id: result.supremo_id ?? null,
        supremo_status: status,
        supremo_attempts: newAttempts,
        supremo_last_error: result.error ?? null,
        supremo_synced_at: result.ok ? new Date().toISOString() : null,
      })
      .eq('id', lead.id)

    results.push({ id: lead.id, status, supremo_id: result.supremo_id })
  }

  return new Response(
    JSON.stringify({
      processed: results.length,
      synced: results.filter((r) => r.status === 'synced').length,
      failed: results.filter((r) => r.status === 'failed').length,
      retry: results.filter((r) => r.status === 'retry').length,
      results,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
