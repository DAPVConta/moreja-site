'use client'

import { useState, type FormEvent } from 'react'
import { Mail, Check, Loader2 } from 'lucide-react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

/**
 * Bloco de inscrição na newsletter — POST para /api/newsletter
 * (endpoint a ser criado posteriormente). Por enquanto o submit
 * persiste localmente e mostra mensagem de sucesso. Quando a edge
 * function/API existir, basta trocar a chamada.
 */
export function NewsletterForm({
  variant = 'dark',
}: {
  variant?: 'dark' | 'light'
} = {}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('submitting')
    setError(null)

    try {
      // Placeholder: armazena local até a API existir
      const stored = JSON.parse(localStorage.getItem('moreja:newsletter') ?? '[]')
      const next = Array.from(new Set([...stored, email.trim()]))
      localStorage.setItem('moreja:newsletter', JSON.stringify(next))

      // Quando a API existir, descomentar:
      // const res = await fetch('/api/newsletter', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: email.trim() }),
      // })
      // if (!res.ok) throw new Error('Falha ao inscrever')

      setStatus('success')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Erro ao inscrever. Tente novamente.')
    }
  }

  const isDark = variant === 'dark'

  return (
    <div>
      <h3
        className={`font-bold uppercase tracking-wider text-xs mb-3 ${
          isDark ? 'text-[#f2d22e]' : 'text-[#010744]'
        }`}
      >
        Newsletter
      </h3>
      <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        Receba lançamentos exclusivos e oportunidades antes de todo mundo.
      </p>

      {status === 'success' ? (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-lg px-4 py-3 ${
            isDark ? 'bg-green-500/15 text-green-300' : 'bg-green-50 text-green-700'
          }`}
        >
          <Check size={18} aria-hidden="true" />
          <span className="text-sm font-medium">Inscrição confirmada!</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2" noValidate>
          <label htmlFor="newsletter-email" className="sr-only">
            E-mail para newsletter
          </label>
          <div className="relative flex-1">
            <Mail
              size={16}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-white/40' : 'text-gray-400'
              }`}
              aria-hidden="true"
            />
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={status === 'submitting'}
              className={`
                w-full h-11 pl-9 pr-3 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-[#f2d22e]
                disabled:opacity-60
                ${isDark
                  ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40'
                  : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400'}
              `}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'submitting' || !email.trim()}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-[#f2d22e] text-[#010744] font-semibold text-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2"
          >
            {status === 'submitting' ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              'Assinar'
            )}
          </button>
        </form>
      )}

      {status === 'error' && error && (
        <p className={`mt-2 text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
      )}
    </div>
  )
}
