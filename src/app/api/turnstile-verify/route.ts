import { NextRequest, NextResponse } from 'next/server'
import { getSiteConfig } from '@/lib/site-config'

/**
 * Verifica o token do Cloudflare Turnstile server-side.
 *
 * O frontend recebe um token via callback do widget; antes de enviar o lead,
 * chama esta route. Se válido, prossegue. Bot detection é responsabilidade
 * da Cloudflare (free).
 *
 * O secret_key fica em site_config (não exposto pro browser, filtrado pela
 * view public_site_config).
 *
 * Doc: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function POST(req: NextRequest) {
  let body: { token?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body.token) {
    return NextResponse.json({ success: false, error: 'missing_token' }, { status: 400 })
  }

  const config = await getSiteConfig()
  const secret = config.turnstile_secret_key?.trim()

  if (!secret) {
    // Não configurado — retorna OK (graceful degradation, mas avisa no log)
    console.warn('[turnstile-verify] secret_key não configurado em site_config')
    return NextResponse.json({ success: true, skipped: 'turnstile_not_configured' })
  }

  // IP do client p/ correlação Cloudflare-side
  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    undefined

  const formData = new URLSearchParams()
  formData.set('secret', secret)
  formData.set('response', body.token)
  if (ip) formData.set('remoteip', ip)
  if (body.action) formData.set('idempotency_key', body.action) // dedup

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body: formData,
    })
    const json = (await res.json()) as {
      success: boolean
      'error-codes'?: string[]
      action?: string
      cdata?: string
      hostname?: string
      challenge_ts?: string
    }

    if (!json.success) {
      return NextResponse.json(
        { success: false, errors: json['error-codes'] ?? [] },
        { status: 200 } // 200 com success:false (frontend trata)
      )
    }

    // Validação extra de action (impede replay de token de outro form)
    if (body.action && json.action && json.action !== body.action) {
      return NextResponse.json(
        { success: false, errors: ['action_mismatch'] },
        { status: 200 }
      )
    }

    return NextResponse.json({ success: true, hostname: json.hostname })
  } catch (err) {
    console.error('[turnstile-verify] network error', err)
    return NextResponse.json(
      { success: false, errors: ['network_error'] },
      { status: 502 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
