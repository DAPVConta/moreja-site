'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, ArrowLeft, Check, Building2, MapPin, User2, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { collectLeadTracking } from '@/lib/lead-tracking'
import { trackLead, trackEvent } from '@/components/seo/PixelEvents'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const TIPOS = [
  { value: 'Apartamento', label: 'Apartamento' },
  { value: 'Casa', label: 'Casa' },
  { value: 'Cobertura', label: 'Cobertura' },
  { value: 'Terreno', label: 'Terreno' },
  { value: 'Sala Comercial', label: 'Sala comercial' },
  { value: 'Galpão', label: 'Galpão' },
] as const

const FINALIDADES = [
  { value: 'Venda', label: 'Vender' },
  { value: 'Locação', label: 'Alugar' },
  { value: 'Ambas', label: 'Ainda não decidi' },
] as const

const ROOMS = ['1', '2', '3', '4+'] as const

interface State {
  step: 1 | 2 | 3 | 4
  // Step 1
  tipo: string
  finalidade: string
  // Step 2
  bairro: string
  cidade: string
  area: string
  dormitorios: string
  // Step 3
  banheiros: string
  vagas: string
  notes: string
  // Step 4
  name: string
  email: string
  phone: string
  consent: boolean
}

const initial: State = {
  step: 1,
  tipo: '',
  finalidade: '',
  bairro: '',
  cidade: '',
  area: '',
  dormitorios: '',
  banheiros: '',
  vagas: '',
  notes: '',
  name: '',
  email: '',
  phone: '',
  consent: false,
}

export function ValuationWizard() {
  const [s, setS] = useState<State>(initial)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const update = <K extends keyof State>(key: K, value: State[K]) =>
    setS((prev) => ({ ...prev, [key]: value }))

  const next = () => setS((p) => ({ ...p, step: Math.min(4, p.step + 1) as State['step'] }))
  const back = () => setS((p) => ({ ...p, step: Math.max(1, p.step - 1) as State['step'] }))

  // Validação por step
  const canAdvance =
    s.step === 1 ? !!s.tipo && !!s.finalidade :
    s.step === 2 ? !!s.bairro.trim() && !!s.cidade.trim() && !!s.area :
    s.step === 3 ? true :
    s.step === 4 ? !!s.name.trim() && !!s.email.trim() && !!s.phone.trim() && s.consent :
    false

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canAdvance) return

    setLoading(true)
    setError('')

    try {
      const event_id = trackEvent('Lead', {
        content_name: 'avaliacao_imovel',
        content_category: s.tipo,
        currency: 'BRL',
      }, { email: s.email, phone: s.phone, firstName: s.name.split(' ')[0] })
      trackLead('avaliacao_imovel', { email: s.email, phone: s.phone })
      const tracking = collectLeadTracking()

      const res = await fetch(`${SUPABASE_URL}/rest/v1/valuation_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          name: s.name,
          email: s.email,
          phone: s.phone,
          tipo: s.tipo,
          finalidade: s.finalidade,
          bairro: s.bairro,
          cidade: s.cidade,
          area_total: Number(s.area) || null,
          dormitorios: Number(s.dormitorios.replace('+', '')) || null,
          banheiros: Number(s.banheiros.replace('+', '')) || null,
          vagas: Number(s.vagas.replace('+', '')) || null,
          notes: s.notes || null,
          consent_lgpd: s.consent,
          utm_source: tracking.utm_source ?? null,
          utm_medium: tracking.utm_medium ?? null,
          utm_campaign: tracking.utm_campaign ?? null,
        }),
      })

      if (!res.ok && res.status !== 409) {
        throw new Error(await res.text().catch(() => 'erro'))
      }

      // Também envia como lead "tradicional" pra ir pro Supremo
      await fetch(`${SUPABASE_URL}/functions/v1/send-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          nome: s.name,
          email: s.email,
          telefone: s.phone,
          mensagem:
            `[AVALIAÇÃO] Quer ${s.finalidade.toLowerCase()} um ${s.tipo} em ` +
            `${s.bairro}, ${s.cidade}. Área ${s.area}m², ${s.dormitorios || '–'} dorms, ` +
            `${s.banheiros || '–'} banh., ${s.vagas || '–'} vagas.${s.notes ? ' Notas: ' + s.notes : ''}`,
          origem: 'avaliacao_imovel',
          event_id,
          ...tracking,
        }),
      }).catch(() => {})

      setSuccess(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? 'Não conseguimos salvar agora. Tente novamente em alguns instantes.'
          : 'Erro inesperado'
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" strokeWidth={3} />
        </div>
        <h2 className="heading-h3 text-[#010744] mb-2">Recebemos sua solicitação!</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Nosso corretor especialista em <strong>{s.bairro || s.cidade}</strong> entrará em
          contato com você em até 24h úteis com a avaliação completa.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4].map((n) => {
          const active = s.step === n
          const done = s.step > n
          return (
            <div key={n} className="flex flex-1 items-center gap-2">
              <span
                aria-current={active ? 'step' : undefined}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-[#010744] text-[#f2d22e]'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : n}
              </span>
              <span
                aria-hidden="true"
                className={`hidden sm:block flex-1 h-0.5 rounded-full transition-colors ${
                  done ? 'bg-emerald-500' : 'bg-gray-200'
                } ${n === 4 ? 'invisible' : ''}`}
              />
            </div>
          )
        })}
      </div>

      {/* Step 1 — Tipo + Finalidade */}
      {s.step === 1 && (
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#010744] text-[#f2d22e]">
              <Building2 size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#010744]">Tipo de imóvel</h3>
              <p className="text-xs text-gray-500">Etapa 1 de 4</p>
            </div>
          </div>

          <fieldset className="mb-6">
            <legend className="block text-sm font-semibold text-[#010744] mb-3">
              Qual o tipo do imóvel?
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIPOS.map((t) => {
                const active = s.tipo === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update('tipo', t.value)}
                    className={`min-h-[48px] rounded-lg border-2 px-3 text-sm font-semibold transition-all ${
                      active
                        ? 'border-[#010744] bg-[#010744] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#010744]'
                    }`}
                    aria-pressed={active}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="block text-sm font-semibold text-[#010744] mb-3">
              O que pretende fazer com ele?
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {FINALIDADES.map((f) => {
                const active = s.finalidade === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => update('finalidade', f.value)}
                    className={`min-h-[48px] rounded-lg border-2 px-3 text-sm font-semibold transition-all ${
                      active
                        ? 'border-[#010744] bg-[#010744] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#010744]'
                    }`}
                    aria-pressed={active}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>
      )}

      {/* Step 2 — Localização + Área */}
      {s.step === 2 && (
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#010744] text-[#f2d22e]">
              <MapPin size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#010744]">Localização e área</h3>
              <p className="text-xs text-gray-500">Etapa 2 de 4</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bairro" className="block text-sm font-semibold text-[#010744] mb-1.5">
                  Bairro <span className="text-red-500">*</span>
                </label>
                <input
                  id="bairro"
                  type="text"
                  value={s.bairro}
                  onChange={(e) => update('bairro', e.target.value)}
                  placeholder="Ex: Boa Viagem"
                  required
                  className="w-full h-12 rounded-lg border border-gray-200 px-3 text-base
                             focus:outline-none focus:ring-2 focus:ring-[#010744]"
                />
              </div>
              <div>
                <label htmlFor="cidade" className="block text-sm font-semibold text-[#010744] mb-1.5">
                  Cidade <span className="text-red-500">*</span>
                </label>
                <input
                  id="cidade"
                  type="text"
                  value={s.cidade}
                  onChange={(e) => update('cidade', e.target.value)}
                  placeholder="Ex: Recife"
                  required
                  className="w-full h-12 rounded-lg border border-gray-200 px-3 text-base
                             focus:outline-none focus:ring-2 focus:ring-[#010744]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="area" className="block text-sm font-semibold text-[#010744] mb-1.5">
                Área total (m²) <span className="text-red-500">*</span>
              </label>
              <input
                id="area"
                type="number"
                inputMode="numeric"
                value={s.area}
                onChange={(e) => update('area', e.target.value)}
                placeholder="Ex: 85"
                required
                min="0"
                className="w-full h-12 rounded-lg border border-gray-200 px-3 text-base
                           focus:outline-none focus:ring-2 focus:ring-[#010744]"
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold text-[#010744] mb-2">
                Dormitórios
              </legend>
              <div className="flex gap-2 flex-wrap">
                {ROOMS.map((r) => {
                  const active = s.dormitorios === r
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => update('dormitorios', active ? '' : r)}
                      className={`min-h-[44px] min-w-[60px] px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                        active
                          ? 'border-[#010744] bg-[#010744] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-[#010744]'
                      }`}
                      aria-pressed={active}
                    >
                      {r}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </div>
        </div>
      )}

      {/* Step 3 — Detalhes opcionais */}
      {s.step === 3 && (
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#010744] text-[#f2d22e]">
              <Building2 size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#010744]">Mais detalhes (opcional)</h3>
              <p className="text-xs text-gray-500">Etapa 3 de 4 — ajuda a refinar a avaliação</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <fieldset>
                <legend className="block text-sm font-semibold text-[#010744] mb-2">
                  Banheiros
                </legend>
                <div className="flex gap-2 flex-wrap">
                  {ROOMS.map((r) => {
                    const active = s.banheiros === r
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => update('banheiros', active ? '' : r)}
                        className={`min-h-[44px] min-w-[44px] px-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                          active
                            ? 'border-[#010744] bg-[#010744] text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-[#010744]'
                        }`}
                        aria-pressed={active}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
              <fieldset>
                <legend className="block text-sm font-semibold text-[#010744] mb-2">
                  Vagas
                </legend>
                <div className="flex gap-2 flex-wrap">
                  {ROOMS.map((r) => {
                    const active = s.vagas === r
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => update('vagas', active ? '' : r)}
                        className={`min-h-[44px] min-w-[44px] px-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                          active
                            ? 'border-[#010744] bg-[#010744] text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-[#010744]'
                        }`}
                        aria-pressed={active}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-[#010744] mb-1.5">
                Algo mais que devemos saber?
              </label>
              <textarea
                id="notes"
                value={s.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={4}
                placeholder="Ex: imóvel com vista pro mar, prédio com lazer completo, reforma recente..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base resize-none
                           focus:outline-none focus:ring-2 focus:ring-[#010744]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4 — Contato */}
      {s.step === 4 && (
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#010744] text-[#f2d22e]">
              <User2 size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#010744]">Como falamos com você?</h3>
              <p className="text-xs text-gray-500">Etapa 4 de 4 — última etapa!</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[#010744] mb-1.5">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={s.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Como podemos te chamar?"
                required
                autoComplete="name"
                autoCapitalize="words"
                className="w-full h-12 rounded-lg border border-gray-200 px-3 text-base
                           focus:outline-none focus:ring-2 focus:ring-[#010744]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#010744] mb-1.5">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={s.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-full h-12 rounded-lg border border-gray-200 px-3 text-base
                             focus:outline-none focus:ring-2 focus:ring-[#010744]"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-[#010744] mb-1.5">
                  WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={s.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  className="w-full h-12 rounded-lg border border-gray-200 px-3 text-base
                             focus:outline-none focus:ring-2 focus:ring-[#010744]"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={s.consent}
                onChange={(e) => update('consent', e.target.checked)}
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#010744] cursor-pointer"
              />
              <span className="leading-relaxed">
                Concordo em receber a avaliação por e-mail e WhatsApp da Morejá.{' '}
                <a
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#010744] underline-offset-2 hover:underline"
                >
                  Política de privacidade
                </a>
                .
              </span>
            </label>

            {error && (
              <p
                className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={back}
          disabled={s.step === 1}
          className="inline-flex items-center gap-2 min-h-[44px] px-3 text-sm font-medium text-gray-600
                     transition-colors hover:text-[#010744] disabled:opacity-40 disabled:pointer-events-none"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar
        </button>

        {s.step < 4 ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={next}
            disabled={!canAdvance}
          >
            Continuar
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!canAdvance}
          >
            <Send size={18} aria-hidden="true" />
            Receber avaliação
          </Button>
        )}
      </div>
    </form>
  )
}
