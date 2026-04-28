'use client'

import { useState, type FormEvent } from 'react'
import { Sparkles, Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface LaunchesWaitlistProps {
  eyebrow?: string
  title?: string
  subtitle?: string
  /** ID/slug do lançamento específico, ou null para "geral". */
  lancamentoId?: string | null
  /** Lista de itens-benefício mostrados. */
  benefits?: string[]
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function LaunchesWaitlist({
  eyebrow = 'Pré-Lançamento',
  title = 'Seja avisado primeiro',
  subtitle = 'Receba acesso antecipado aos novos empreendimentos da Morejá. Condições especiais para os primeiros inscritos.',
  lancamentoId = null,
  benefits = [
    'Plantas e valores em primeira mão',
    'Condições especiais de pré-lançamento',
    'Visita guiada ao stand de vendas',
    'Sem spam — só quando tiver lançamento',
  ],
}: LaunchesWaitlistProps) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !consent) return

    setLoading(true)
    setError('')

    try {
      // Insere direto via PostgREST (a tabela aceita service_role + anon insert
      // controlado por RLS — quando a função send-lead for estendida, troca aqui).
      const res = await fetch(`${SUPABASE_URL}/rest/v1/lancamentos_waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          email,
          name: name || null,
          phone: phone || null,
          lancamento_id: lancamentoId,
          consent_lgpd: consent,
          utm_source: typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('utm_source')
            : null,
        }),
      })

      if (!res.ok) {
        // 409 = email já cadastrado (UNIQUE constraint) — tratamos como sucesso "já está na lista"
        if (res.status === 409) {
          setSuccess(true)
        } else {
          throw new Error('Erro ao salvar')
        }
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Não foi possível salvar. Tente novamente em alguns instantes.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <section className="section bg-[#010744] text-white">
        <div className="container-page max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2d22e]">
            <Check className="h-8 w-8 text-[#010744]" strokeWidth={3} />
          </div>
          <h2 className="heading-h2 text-white mb-3">Você está na lista!</h2>
          <p className="lead text-gray-300">
            Vamos avisar você por e-mail assim que o próximo lançamento estiver disponível.
            Enquanto isso, dê uma olhada nos imóveis em destaque.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="section relative overflow-hidden bg-[#010744] text-white">
      {/* Decorativo: dotted pattern + yellow blob (consistente com LaunchesPreview) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full
                   bg-[#f2d22e]/10 blur-3xl"
      />

      <div className="relative container-page">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          {/* Coluna esquerda: pitch */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f2d22e] px-3 py-1
                            text-xs font-bold uppercase tracking-widest text-[#010744] mb-4">
              <Sparkles size={14} aria-hidden="true" />
              {eyebrow}
            </div>
            <h2 className="heading-h2 text-white mb-3">{title}</h2>
            <p className="lead text-gray-300 mb-8 max-w-xl">{subtitle}</p>

            <ul className="space-y-3 max-w-md">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-200">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f2d22e]/20">
                    <Check size={14} className="text-[#f2d22e]" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna direita: form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-6 sm:p-8 shadow-2xl"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2d22e] text-[#010744]">
                <Bell size={18} />
              </span>
              <span className="text-sm font-semibold uppercase tracking-wider text-[#f2d22e]">
                Lista de espera
              </span>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome (opcional)"
                autoComplete="name"
                autoCapitalize="words"
                className="w-full h-12 rounded-lg border border-white/15 bg-white/10 px-3
                           text-base text-white placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-[#f2d22e] focus:border-transparent"
                aria-label="Nome"
              />
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail *"
                required
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full h-12 rounded-lg border border-white/15 bg-white/10 px-3
                           text-base text-white placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-[#f2d22e] focus:border-transparent"
                aria-label="E-mail"
              />
              <input
                type="tel"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp (opcional)"
                autoComplete="tel"
                inputMode="tel"
                className="w-full h-12 rounded-lg border border-white/15 bg-white/10 px-3
                           text-base text-white placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-[#f2d22e] focus:border-transparent"
                aria-label="WhatsApp"
              />
            </div>

            <label className="mt-4 flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
                className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10
                           accent-[#f2d22e] cursor-pointer"
              />
              <span className="leading-relaxed">
                Concordo em receber comunicações da Morejá por e-mail e WhatsApp.{' '}
                <a
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f2d22e] underline-offset-2 hover:underline"
                >
                  Política de privacidade
                </a>
                .
              </span>
            </label>

            {error && (
              <p
                className="mt-3 rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-200"
                role="alert"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!email.trim() || !consent}
              className="mt-5 w-full"
            >
              Quero ser avisado primeiro
            </Button>

            <p className="mt-3 text-center text-xs text-gray-400">
              Seus dados estão protegidos. Cancele quando quiser.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
