'use client'

/**
 * CtaAnunciar — split-layout CTA com mini-form de avaliação de imóvel.
 *
 * Desktop (lg+): 2 colunas — pitch à esquerda, card branco com form à direita.
 * Mobile (<lg):  stack vertical — pitch acima, form abaixo, full-width.
 *
 * Submit handler:
 *  - Valida CEP (8 dígitos) e WhatsApp (10–11 dígitos).
 *  - Persiste em localStorage na chave `moreja:valuation-leads`.
 *  - Dispara toast.success via react-hot-toast.
 *  - TODO: substituir persistência local por chamada à API real de leads.
 *
 * Acessibilidade:
 *  - aria-label em cada input.
 *  - aria-live="polite" na zona de erros inline.
 *  - Focus-visible com anel amarelo 2px + offset.
 *  - Touch target 44×44 nos campos e botão.
 */

import { useState, useId, type FormEvent, type ChangeEvent } from 'react'
import { Check, Home, PhoneCall } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AnimatedChip } from '@/components/ui/AnimatedChip'
import { MagneticButton } from '@/components/ui/MagneticButton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ValuationLead {
  cep: string
  whatsapp: string
  savedAt: string
}

// ─── Masks ────────────────────────────────────────────────────────────────────

function maskCep(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return digits
}

function maskWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2)  return digits
  if (digits.length <= 6)  return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateCep(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 8) return 'CEP deve ter 8 dígitos.'
  return null
}

function validateWhatsApp(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 11) return 'WhatsApp deve ter 10 ou 11 dígitos.'
  return null
}

// ─── Trust marks ─────────────────────────────────────────────────────────────

const trustMarks = [
  'Resposta em até 2h',
  'Avaliação gratuita',
  'Sem compromisso',
]

// ─── Component ────────────────────────────────────────────────────────────────

export function CtaAnunciar() {
  const idPrefix = useId()
  const cepId       = `${idPrefix}-cep`
  const whatsappId  = `${idPrefix}-whatsapp`
  const errorZoneId = `${idPrefix}-errors`

  const [cep, setCep]           = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [errors, setErrors]     = useState<{ cep?: string; whatsapp?: string }>({})
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleCepChange(e: ChangeEvent<HTMLInputElement>) {
    const masked = maskCep(e.target.value)
    setCep(masked)
    if (errors.cep) setErrors((prev) => ({ ...prev, cep: undefined }))
  }

  function handleWhatsAppChange(e: ChangeEvent<HTMLInputElement>) {
    const masked = maskWhatsApp(e.target.value)
    setWhatsapp(masked)
    if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }))
  }

  function validate(): boolean {
    const cepErr      = validateCep(cep)
    const whatsappErr = validateWhatsApp(whatsapp)
    setErrors({ cep: cepErr ?? undefined, whatsapp: whatsappErr ?? undefined })
    return !cepErr && !whatsappErr
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // TODO: substituir por chamada à API real de leads
      const lead: ValuationLead = {
        cep:     cep.replace(/\D/g, ''),
        whatsapp: whatsapp.replace(/\D/g, ''),
        savedAt: new Date().toISOString(),
      }
      const existing: ValuationLead[] = JSON.parse(
        localStorage.getItem('moreja:valuation-leads') ?? '[]'
      )
      localStorage.setItem(
        'moreja:valuation-leads',
        JSON.stringify([...existing, lead])
      )
      setSubmitted(true)
      toast.success('Recebemos seu pedido! Entraremos em contato em até 2h.')
    } catch {
      toast.error('Algo deu errado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="section bg-mesh-cream">
      <div className="container-page">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* ── Coluna esquerda: pitch ──────────────────────────────────── */}
          <div className="mb-10 lg:mb-0">
            <AnimatedChip
              icon={Home}
              variant="gold"
              pulse
              className="mb-4"
              as="span"
            >
              Anuncie seu imóvel
            </AnimatedChip>

            <h2 className="section-title text-[#010744] mb-4">
              Quer vender ou alugar<br className="hidden sm:block" /> seu imóvel?
            </h2>

            <p className="lead mb-8 max-w-prose">
              Conte com a Morejá para encontrar o melhor negócio. Nossa equipe de
              corretores está pronta para ajudar você a conseguir o máximo pelo
              seu patrimônio.
            </p>

            {/* Trust marks */}
            <ul className="space-y-3" aria-label="Diferenciais do serviço">
              {trustMarks.map((mark) => (
                <li key={mark} className="flex items-center gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-[#010744] flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <Check className="w-3.5 h-3.5 text-[#f2d22e]" strokeWidth={3} />
                  </span>
                  <span className="text-[#010744] font-medium">{mark}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Coluna direita: card com form ───────────────────────────── */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
              {submitted ? (
                /* Success state */
                <div
                  className="flex flex-col items-center text-center py-6 gap-4"
                  role="status"
                  aria-live="polite"
                >
                  <span className="w-14 h-14 rounded-full bg-[#010744] flex items-center justify-center mb-2">
                    <Check className="w-7 h-7 text-[#f2d22e]" strokeWidth={2.5} />
                  </span>
                  <h3 className="text-xl font-bold text-[#010744]">
                    Pedido recebido!
                  </h3>
                  <p className="text-gray-600 max-w-xs">
                    Nossa equipe entrará em contato via WhatsApp em até 2h úteis.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSubmitted(false); setCep(''); setWhatsapp('') }}
                    className="text-sm text-[#010744] underline underline-offset-2 hover:no-underline
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2 rounded"
                  >
                    Enviar outra avaliação
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <PhoneCall className="w-5 h-5 text-[#f2d22e]" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-[#010744]">
                      Avalie seu imóvel gratuitamente
                    </h3>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    aria-label="Formulário de avaliação de imóvel"
                  >
                    {/* Error zone — lido por screen readers quando atualizado */}
                    <div
                      id={errorZoneId}
                      aria-live="polite"
                      aria-atomic="true"
                      className="sr-only"
                    >
                      {errors.cep || errors.whatsapp
                        ? `Erros no formulário: ${[errors.cep, errors.whatsapp].filter(Boolean).join(' ')}`
                        : ''}
                    </div>

                    {/* CEP */}
                    <div className="mb-4">
                      <label
                        htmlFor={cepId}
                        className="block text-sm font-semibold text-[#010744] mb-1.5"
                      >
                        CEP do imóvel
                      </label>
                      <input
                        id={cepId}
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="00000-000"
                        value={cep}
                        onChange={handleCepChange}
                        aria-label="CEP do imóvel"
                        aria-describedby={errors.cep ? `${cepId}-error` : undefined}
                        aria-invalid={!!errors.cep}
                        className={[
                          'w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-[#010744]',
                          'text-base placeholder:text-gray-400',
                          'transition-all duration-200',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2',
                          errors.cep
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-[#010744]',
                        ].join(' ')}
                      />
                      {errors.cep && (
                        <p
                          id={`${cepId}-error`}
                          role="alert"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {errors.cep}
                        </p>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div className="mb-6">
                      <label
                        htmlFor={whatsappId}
                        className="block text-sm font-semibold text-[#010744] mb-1.5"
                      >
                        WhatsApp para contato
                      </label>
                      <input
                        id={whatsappId}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(00) 00000-0000"
                        value={whatsapp}
                        onChange={handleWhatsAppChange}
                        aria-label="WhatsApp para contato"
                        aria-describedby={errors.whatsapp ? `${whatsappId}-error` : undefined}
                        aria-invalid={!!errors.whatsapp}
                        className={[
                          'w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-[#010744]',
                          'text-base placeholder:text-gray-400',
                          'transition-all duration-200',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2',
                          errors.whatsapp
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-[#010744]',
                        ].join(' ')}
                      />
                      {errors.whatsapp && (
                        <p
                          id={`${whatsappId}-error`}
                          role="alert"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {errors.whatsapp}
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <MagneticButton
                      variant="gold"
                      size="lg"
                      type="submit"
                      disabled={loading}
                      aria-busy={loading}
                      className="w-full justify-center"
                    >
                      {loading ? 'Enviando…' : 'Avaliar agora'}
                    </MagneticButton>

                    {/* Micro-text */}
                    <p className="mt-3 text-center text-xs text-gray-500">
                      Atendimento em até 2h úteis · LGPD-friendly
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

CtaAnunciar.displayName = 'CtaAnunciar'
