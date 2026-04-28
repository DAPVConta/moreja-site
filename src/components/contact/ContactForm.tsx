'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Check } from 'lucide-react'
import { collectLeadTracking } from '@/lib/lead-tracking'
import { trackLead } from '@/components/seo/PixelEvents'
import { TurnstileWidget, Honeypot } from '@/components/seo/TurnstileWidget'
import { verifyTurnstileToken, passedMinTimeToSubmit } from '@/lib/turnstile'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface ContactFormProps {
  turnstileSiteKey?: string
}

const ASSUNTOS = [
  'Quero comprar um imóvel',
  'Quero alugar um imóvel',
  'Quero anunciar meu imóvel',
  'Avaliação de imóvel',
  'Informações gerais',
  'Outro assunto',
]

export function ContactForm({ turnstileSiteKey }: ContactFormProps = {}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const formMountedAt = useRef<number>(Date.now())

  useEffect(() => {
    formMountedAt.current = Date.now()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!nome.trim() || !email.trim() || !mensagem.trim()) return

    // Honeypot check — campo invisível "website" que humanos não preenchem
    const fd = new FormData(e.currentTarget)
    if (fd.get('website')) {
      setSuccess(true) // simula sucesso pra bot
      return
    }
    // Min-time-to-submit check (>= 2s desde mount)
    if (!passedMinTimeToSubmit(formMountedAt.current)) {
      setError('Aguarde alguns instantes antes de enviar.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Verifica Turnstile (se configurado)
      if (turnstileSiteKey) {
        const verify = await verifyTurnstileToken(turnstileToken, 'contact-form')
        if (!verify.ok) {
          setError('Verificação de segurança falhou. Tente novamente.')
          setLoading(false)
          return
        }
      }

      // Pixel + CAPI client-side (gera event_id compartilhado)
      const event_id = trackLead('pagina_contato', { email, phone: telefone })
      const tracking = collectLeadTracking()

      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          mensagem: assunto ? `[${assunto}] ${mensagem}` : mensagem,
          origem: 'pagina_contato',
          event_id,
          ...tracking,
        }),
      })

      if (!res.ok) throw new Error('Erro ao enviar')
      setSuccess(true)
    } catch {
      setError('Ocorreu um erro. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Mensagem enviada!</h3>
        <p className="text-gray-600">
          Recebemos sua mensagem e em breve entraremos em contato.
        </p>
      </div>
    )
  }

  const inputCls =
    'w-full px-3 py-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cf-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            id="cf-name"
            type="text"
            name="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoComplete="name"
            autoCapitalize="words"
            className={inputCls}
            placeholder="Seu nome completo"
          />
        </div>
        <div>
          <label htmlFor="cf-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            id="cf-phone"
            type="tel"
            name="phone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            className={inputCls}
            placeholder="(XX) XXXXX-XXXX"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cf-email" className="block text-sm font-medium text-gray-700 mb-1">
          E-mail <span className="text-red-500">*</span>
        </label>
        <input
          id="cf-email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          className={inputCls}
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label htmlFor="cf-subject" className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
        <select
          id="cf-subject"
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          className={`${inputCls} bg-white`}
        >
          <option value="">Selecione um assunto</option>
          {ASSUNTOS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cf-message" className="block text-sm font-medium text-gray-700 mb-1">
          Mensagem <span className="text-red-500">*</span>
        </label>
        <textarea
          id="cf-message"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          required
          rows={5}
          className={`${inputCls} resize-none`}
          placeholder="Como podemos te ajudar?"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" role="alert">{error}</p>
      )}

      {/* Honeypot anti-bot (invisível) */}
      <Honeypot />

      {/* Turnstile widget (só renderiza se admin configurou site_key) */}
      {turnstileSiteKey && (
        <TurnstileWidget
          sitekey={turnstileSiteKey}
          action="contact-form"
          onVerify={setTurnstileToken}
          onExpired={() => setTurnstileToken('')}
        />
      )}

      <button
        type="submit"
        disabled={loading || (!!turnstileSiteKey && !turnstileToken)}
        className="w-full flex items-center justify-center gap-2 bg-[#010744] hover:bg-[#0a1a6e] text-white py-3.5 rounded-lg font-semibold transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744] focus-visible:ring-offset-2"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Enviando...' : 'Enviar mensagem'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Seus dados estão seguros. Nunca compartilhamos com terceiros.
      </p>
    </form>
  )
}
