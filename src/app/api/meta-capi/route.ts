import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { getSiteConfig } from '@/lib/site-config'

/**
 * Meta Conversions API (CAPI) server-side endpoint.
 *
 *   • Recebe eventos do PixelEvents.tsx (browser)
 *   • Hashea PII (email, phone, nome) com SHA-256 (Meta exige normalized + hashed)
 *   • POSTa para Meta Graph API com event_id compartilhado p/ dedup com pixel
 *   • Pega IP e User-Agent do request automaticamente
 *
 * Configurar em site_config (admin):
 *   • meta_capi_access_token  — System User Token do Business Manager
 *   • meta_capi_test_event_code (opcional, para testes em /events_manager)
 *   • fb_pixel_id  — ID do pixel (compartilhado com pixel browser)
 *
 * Documentação: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

interface CapiPayload {
  event_name: string
  event_id: string
  event_source_url?: string
  custom_data?: Record<string, unknown>
  user_data?: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
  }
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

function normalize(input: string | undefined, type: 'email' | 'phone' | 'name'): string | null {
  if (!input) return null
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null
  if (type === 'phone') {
    // Só dígitos, com DDI 55 (Brasil) se faltando
    let digits = trimmed.replace(/\D/g, '')
    if (digits.length === 11 || digits.length === 10) digits = '55' + digits
    return digits
  }
  return trimmed
}

export async function POST(req: NextRequest) {
  let payload: CapiPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const config = await getSiteConfig()
  const pixelId = config.fb_pixel_id?.trim()
  const accessToken = config.meta_capi_access_token?.trim()
  const testEventCode = config.meta_capi_test_event_code?.trim() || undefined

  if (!pixelId || !accessToken) {
    // Não configurado — retorna OK silencioso (não é erro do client)
    return NextResponse.json({ skipped: 'capi_not_configured' }, { status: 200 })
  }

  // Pega IP real e User-Agent
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  const userAgent = req.headers.get('user-agent') ?? undefined

  // Hashea PII
  const u = payload.user_data ?? {}
  const user_data: Record<string, string> = {}

  const email = normalize(u.email, 'email')
  if (email) user_data.em = sha256(email)

  const phone = normalize(u.phone, 'phone')
  if (phone) user_data.ph = sha256(phone)

  const firstName = normalize(u.firstName, 'name')
  if (firstName) user_data.fn = sha256(firstName)

  const lastName = normalize(u.lastName, 'name')
  if (lastName) user_data.ln = sha256(lastName)

  if (ip) user_data.client_ip_address = ip
  if (userAgent) user_data.client_user_agent = userAgent

  // Cookies _fbp (Facebook browser id) e _fbc (click id) — Meta usa pra match
  const cookies = req.headers.get('cookie') ?? ''
  const fbpMatch = cookies.match(/_fbp=([^;]+)/)
  const fbcMatch = cookies.match(/_fbc=([^;]+)/)
  if (fbpMatch) user_data.fbp = fbpMatch[1]
  if (fbcMatch) user_data.fbc = fbcMatch[1]

  const event = {
    event_name: payload.event_name,
    event_id: payload.event_id,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: payload.event_source_url,
    action_source: 'website',
    user_data,
    custom_data: payload.custom_data ?? {},
  }

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`

  try {
    const body: Record<string, unknown> = { data: [event] }
    if (testEventCode) body.test_event_code = testEventCode

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[meta-capi] error', res.status, text)
      return NextResponse.json(
        { error: 'capi_upstream_error', status: res.status },
        { status: 502 }
      )
    }

    const json = (await res.json()) as { events_received?: number; messages?: string[] }
    return NextResponse.json({ ok: true, events_received: json.events_received ?? 1 })
  } catch (err) {
    console.error('[meta-capi] fetch failed', err)
    return NextResponse.json({ error: 'capi_network_error' }, { status: 502 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
