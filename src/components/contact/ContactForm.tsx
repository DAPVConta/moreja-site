'use client'

import { useState } from 'react'
import { Send, Check } from 'lucide-react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const ASSUNTOS = [
  'Quero comprar um imóvel',
  'Quero alugar um imóvel',
  'Quero anunciar meu imóvel',
  'Avaliação de imóvel',
  'Informações gerais',
  'Outro assunto',
]

export function ContactForm() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !email.trim() || !mensagem.trim()) return

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
          mensagem: assunto ? `[${assunto}] ${mensagem}` : mensagem,
          origem: 'pagina_contato',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent"
            placeholder="Seu nome completo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent"
            placeholder="(XX) XXXXX-XXXX"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent"
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
        <select
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent bg-white"
        >
          <option value="">Selecione um assunto</option>
          {ASSUNTOS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mensagem <span className="text-red-500">*</span>
        </label>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          required
          rows={5}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent resize-none"
          placeholder="Como podemos te ajudar?"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#010744] hover:bg-[#0a1a6e] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60"
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
