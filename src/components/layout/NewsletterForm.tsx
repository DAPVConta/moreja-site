'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Mail, Loader2 } from 'lucide-react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

/**
 * NewsletterForm — bloco de inscrição na newsletter.
 *
 * Upgrades 2025/2026:
 * - Button embedded à direita do input (compact gold pill)
 * - Gradient border animado no focus (navy→yellow→navy via CSS custom property)
 * - Animated check SVG com stroke-dashoffset ao sucesso (~600ms)
 * - Social proof line com avatares stack + contador de assinantes
 * - Variants dark | light (contrato mantido com Footer e HomeBanner)
 *
 * TODO(backend): substituir localStorage por POST /api/newsletter
 *   quando Edge Function existir — bloco marcado abaixo.
 */
export function NewsletterForm({
  variant = 'dark',
  subscribersCount = 1247,
}: {
  variant?: 'dark' | 'light'
  /** Exibido na linha de social proof. Default 1.247. */
  subscribersCount?: number
} = {}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const checkRef = useRef<SVGPathElement | null>(null)
  const checkWrapRef = useRef<HTMLDivElement | null>(null)

  // Formata contador: 1247 → "1.247"
  const formattedCount = subscribersCount.toLocaleString('pt-BR')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('submitting')
    setError(null)

    try {
      // TODO(backend): trocar por POST /api/newsletter quando Edge Function existir.
      // const res = await fetch('/api/newsletter', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: email.trim() }),
      // })
      // if (!res.ok) throw new Error('Falha ao inscrever')

      // Placeholder: persiste local até a API existir
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('moreja:newsletter') ?? '[]')
        const next = Array.from(new Set([...stored, email.trim()]))
        localStorage.setItem('moreja:newsletter', JSON.stringify(next))
      }

      setStatus('success')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Erro ao inscrever. Tente novamente.')
    }
  }

  // Dispara animação do checkmark SVG assim que o estado 'success' for ativado
  useEffect(() => {
    if (status !== 'success') return
    const path = checkRef.current
    if (!path) return

    // Respeita prefers-reduced-motion
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    }

    const length = path.getTotalLength()
    path.style.strokeDasharray = String(length)
    path.style.strokeDashoffset = String(length)
    // Força reflow antes de animar (necessário para transition funcionar)
    path.getBoundingClientRect()
    path.style.transition = 'stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1)'
    path.style.strokeDashoffset = '0'
  }, [status])

  const isDark = variant === 'dark'

  // Cores baseadas na variant
  const textMuted = isDark ? 'text-gray-300' : 'text-gray-600'
  const textHeading = isDark ? 'text-[#f2d22e]' : 'text-[#010744]'
  const successBg = isDark ? 'bg-green-500/15' : 'bg-green-50'
  const successText = isDark ? 'text-green-300' : 'text-green-700'
  const checkColor = isDark ? '#86efac' : '#16a34a'
  const errorText = isDark ? 'text-red-300' : 'text-red-600'

  return (
    <div>
      {/* Label */}
      <h3 className={`font-bold uppercase tracking-wider text-xs mb-3 ${textHeading}`}>
        Newsletter
      </h3>
      <p className={`text-sm mb-4 leading-relaxed ${textMuted}`}>
        Receba lançamentos exclusivos e oportunidades antes de todo mundo.
      </p>

      {/* ── Success state ─────────────────────────────────────────── */}
      {status === 'success' ? (
        <div
          ref={checkWrapRef}
          role="status"
          aria-live="polite"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 ${successBg} ${successText} motion-safe:animate-[newsletter-fade-in_300ms_ease-out_both]`}
        >
          {/* Animated check SVG */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            {/* Circle background */}
            <circle
              cx="11"
              cy="11"
              r="10"
              fill={isDark ? 'rgba(134,239,172,0.15)' : 'rgba(22,163,74,0.1)'}
            />
            {/* Animated check path */}
            <path
              ref={checkRef}
              d="M6.5 11.5 L9.5 14.5 L15.5 8.5"
              stroke={checkColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span className="text-sm font-medium">Inscrição confirmada!</span>
        </div>
      ) : (
        /* ── Form ──────────────────────────────────────────────────── */
        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="newsletter-email" className="sr-only">
            E-mail para newsletter
          </label>

          {/*
            Wrapper do input com gradient border animado no focus.
            Usa padding="2px" para dar espaço à border transparente e um
            pseudo-elemento de background que cobre o padding interior.
            Técnica: border: 2px solid transparent + background-clip.
          */}
          <div
            className={`
              newsletter-input-wrapper relative flex items-center rounded-xl
              transition-shadow duration-200
              ${focused ? 'shadow-md' : 'shadow-sm'}
            `}
            style={
              focused
                ? {
                    background:
                      'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #010744 0%, #f2d22e 50%, #010744 100%) border-box',
                    border: '2px solid transparent',
                  }
                : {
                    border: isDark ? '2px solid rgba(255,255,255,0.15)' : '2px solid #e5e7eb',
                  }
            }
          >
            {/* Mail icon */}
            <Mail
              size={16}
              className={`absolute left-3.5 shrink-0 pointer-events-none ${
                isDark && !focused ? 'text-white/40' : 'text-gray-400'
              }`}
              aria-hidden="true"
            />

            {/* Input */}
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="seu@email.com"
              disabled={status === 'submitting'}
              aria-describedby="newsletter-social-proof"
              className={`
                w-full h-11 pl-9 pr-[88px] bg-transparent text-sm rounded-xl
                focus:outline-none disabled:opacity-60
                ${isDark && !focused ? 'text-white placeholder:text-white/40' : 'text-gray-900 placeholder:text-gray-400'}
              `}
            />

            {/* Embedded submit button — absolute right inside wrapper */}
            <button
              type="submit"
              disabled={status === 'submitting' || !email.trim()}
              aria-label={status === 'submitting' ? 'Aguarde…' : 'Assinar newsletter'}
              className="
                absolute right-1.5 top-1/2 -translate-y-1/2
                inline-flex items-center justify-center gap-1.5
                h-8 px-3.5 rounded-lg
                bg-[#f2d22e] text-[#010744] font-semibold text-xs
                hover:brightness-105 active:scale-[0.97]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150 cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-1
                min-w-[72px]
              "
            >
              {status === 'submitting' ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                'Assinar'
              )}
            </button>
          </div>

          {/* Error message */}
          {status === 'error' && error && (
            <p
              role="alert"
              aria-live="assertive"
              className={`mt-2 text-xs ${errorText}`}
            >
              {error}
            </p>
          )}

          {/* ── Social proof line ────────────────────────────────── */}
          <div
            id="newsletter-social-proof"
            className={`mt-3 flex items-center gap-2 ${textMuted}`}
          >
            {/* Avatar stack — placeholders até implementar fotos reais */}
            <div className="flex -space-x-1.5" aria-hidden="true">
              {['R', 'M', 'A', 'P'].map((initial) => (
                <span
                  key={initial}
                  className="
                    inline-flex items-center justify-center
                    w-5 h-5 rounded-full
                    bg-[#f2d22e] text-[#010744]
                    text-[9px] font-bold
                    ring-1 ring-white/30
                    select-none
                  "
                >
                  {initial}
                </span>
              ))}
            </div>
            <span className="text-xs">
              Junte-se a <span className="font-semibold tabular-nums">{formattedCount}</span> assinantes
            </span>
          </div>
        </form>
      )}

      {/*
        Keyframe newsletter-fade-in injetado como <style> inline para isolar
        do CSS global. Ativado pela classe motion-safe: no success state.
      */}
      <style>{newsletterStyles}</style>
    </div>
  )
}

// ─── Inline animation styles ──────────────────────────────────────────────────

const newsletterStyles = `
  @keyframes newsletter-fade-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`
