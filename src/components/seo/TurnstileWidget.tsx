'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement | string,
        opts: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          appearance?: 'always' | 'execute' | 'interaction-only'
          size?: 'normal' | 'compact' | 'invisible'
          action?: string
          retry?: 'auto' | 'never'
        }
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface TurnstileWidgetProps {
  sitekey: string
  /** Action label p/ analytics no Turnstile dashboard. */
  action?: string
  /** Callback chamado com o token quando challenge completa. */
  onVerify: (token: string) => void
  onExpired?: () => void
  onError?: () => void
  /** 'invisible' executa challenge silenciosamente; 'normal' mostra widget. */
  size?: 'normal' | 'compact' | 'invisible'
  className?: string
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/**
 * Widget Cloudflare Turnstile — bot detection sem PII (free, alternativa
 * ao reCAPTCHA). Lazy-load do script global na primeira montagem.
 *
 * Uso típico:
 *   const [token, setToken] = useState('')
 *   <TurnstileWidget sitekey={SITEKEY} onVerify={setToken} action="lead-form" />
 *   ...no submit, manda token junto e valida server-side via /api/turnstile-verify
 */
export function TurnstileWidget({
  sitekey,
  action,
  onVerify,
  onExpired,
  onError,
  size = 'normal',
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(
    typeof window !== 'undefined' && !!window.turnstile
  )

  // Lazy-load do script global (apenas uma vez por página)
  useEffect(() => {
    if (scriptReady) return
    const existing = document.querySelector(`script[src^="${SCRIPT_SRC.split('?')[0]}"]`)
    if (existing) {
      existing.addEventListener('load', () => setScriptReady(true))
      return
    }
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => setScriptReady(true)
    document.head.appendChild(s)
  }, [scriptReady])

  // Render widget quando script carregar
  useEffect(() => {
    if (!scriptReady || !containerRef.current || widgetIdRef.current) return
    if (!window.turnstile) return

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey,
      action,
      size,
      theme: 'light',
      retry: 'auto',
      callback: onVerify,
      'expired-callback': onExpired,
      'error-callback': onError,
    })

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch { /* ignore */ }
        widgetIdRef.current = null
      }
    }
  }, [scriptReady, sitekey, action, size, onVerify, onExpired, onError])

  if (!sitekey) return null
  return <div ref={containerRef} className={className} />
}

/**
 * Honeypot field — campo invisível que humanos NUNCA preenchem mas bots
 * costumam preencher. Diferenciador grátis e simples antes do Turnstile.
 *
 * Uso:
 *   const honeypotRef = useRef<HTMLInputElement>(null)
 *   <Honeypot ref={honeypotRef} />
 *   no submit: if (honeypotRef.current?.value) return  // bot
 */
export function Honeypot({ name = 'website' }: { name?: string }) {
  // tabIndex -1 + aria-hidden + sr-only positioning
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <label htmlFor={`hp-${name}`}>Não preencha este campo</label>
      <input
        type="text"
        id={`hp-${name}`}
        name={name}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  )
}
