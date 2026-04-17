'use client'

import { useState } from 'react'
import { Send, Check } from 'lucide-react'

interface LeadFormInlineProps {
  imovelId: string
  imovelCodigo: string
  imovelTitulo: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function LeadFormInline({ imovelId, imovelCodigo, imovelTitulo }: LeadFormInlineProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [mensagem, setMensagem] = useState(
    `Olá! Tenho interesse no imóvel "${imovelTitulo}" (ref. ${imovelCodigo}). Gostaria de mais informações.`
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !email.trim()) return

    setLoading(true)
    setError('')

    try {
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
          mensagem,
          imovel_id: imovelId,
          imovel_codigo: imovelCodigo,
          origem: 'pagina_imovel',
        }),
      })

      if (!res.ok) throw new Error('Erro ao enviar')
      setSuccess(true)
    } catch {
      setError('Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <h4 className="font-semibold text-gray-900 mb-1">Mensagem enviada!</h4>
        <p className="text-sm text-gray-600">
          Em breve um corretor entrará em contato com você.
        </p>
      </div>
    )
  }

  const inputCls =
    'w-full px-3 py-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <input
        type="text"
        name="name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome *"
        required
        autoComplete="name"
        autoCapitalize="words"
        className={inputCls}
      />
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail *"
        required
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        className={inputCls}
      />
      <input
        type="tel"
        name="phone"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        placeholder="Telefone / WhatsApp"
        autoComplete="tel"
        inputMode="tel"
        className={inputCls}
      />
      <textarea
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        rows={4}
        className={`${inputCls} resize-none`}
      />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#010744] hover:bg-[#0a1a6e] text-white py-3.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744] focus-visible:ring-offset-2"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Enviando...' : 'Enviar mensagem'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        Seus dados estão protegidos. Não fazemos spam.
      </p>
    </form>
  )
}
