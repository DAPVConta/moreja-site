'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, ArrowRight } from 'lucide-react'
import { PROPERTY_TYPES } from '@/types/property'

const HISTORY_KEY = 'moreja:search-history'
const MAX_HISTORY = 5

function readHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string').slice(0, MAX_HISTORY) : []
  } catch {
    return []
  }
}

function pushHistory(term: string) {
  if (typeof window === 'undefined' || !term.trim()) return
  const current = readHistory()
  const next = [term, ...current.filter((s) => s !== term)].slice(0, MAX_HISTORY)
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    /* quota exceeded — silenciar */
  }
}

const QUICK_SUGGESTIONS = [
  { label: 'Apartamentos para alugar', q: '', tipo: 'Apartamento', target: '/alugar' },
  { label: 'Casas para comprar', q: '', tipo: 'Casa', target: '/comprar' },
  { label: 'Salas comerciais', q: '', tipo: 'Sala Comercial', target: '/comprar' },
  { label: 'Lançamentos', q: '', tipo: '', target: '/empreendimentos' },
] as const

/**
 * Botão de busca persistente no header (visível em < lg).
 * Abre overlay full-screen com input grande, histórico e atalhos.
 */
export function MobileSearchButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Foca o input ao abrir e carrega histórico
  useEffect(() => {
    if (!open) return
    setHistory(readHistory())
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [open])

  // Lock body scroll + ESC fecha
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function navigate(term: string, propertyType: string, base = '/comprar') {
    pushHistory(term)
    const params = new URLSearchParams()
    if (term) params.set('q', term)
    if (propertyType) params.set('tipo', propertyType)
    const qs = params.toString()
    router.push(qs ? `${base}?${qs}` : base)
    setOpen(false)
    setQuery('')
    setTipo('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!query.trim() && !tipo) return
    navigate(query.trim(), tipo)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir busca"
        className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-gray-600 hover:text-[#010744] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744] transition-colors"
      >
        <Search size={22} aria-hidden="true" />
      </button>

      {/* Overlay — sempre montado para animar opacidade */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar imóveis"
        aria-hidden={!open}
        className={`lg:hidden fixed inset-0 z-[60] bg-white flex flex-col transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Topo: form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-4 h-16 border-b border-gray-100"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar busca"
            className="inline-flex items-center justify-center w-10 h-10 -ml-1 rounded-md text-gray-600 hover:text-[#010744] hover:bg-gray-100 transition-colors"
          >
            <X size={22} />
          </button>
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bairro, cidade ou palavra-chave"
              className="w-full pl-10 pr-3 h-11 border border-gray-200 rounded-lg text-base text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent
                         placeholder:text-gray-400"
            />
          </div>
        </form>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {/* Histórico */}
          {history.length > 0 && (
            <section className="pt-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                Buscas recentes
              </h3>
              <ul className="flex flex-col">
                {history.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(term)
                        navigate(term, '')
                      }}
                      className="w-full flex items-center gap-3 py-3 text-left text-gray-700 border-b border-gray-100 hover:text-[#010744] transition-colors"
                    >
                      <Clock size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
                      <span className="flex-1 truncate">{term}</span>
                      <ArrowRight size={14} className="text-gray-300" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Atalhos */}
          <section className="pt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
              Atalhos populares
            </h3>
            <ul className="flex flex-col">
              {QUICK_SUGGESTIONS.map((s) => (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => navigate('', s.tipo, s.target)}
                    className="w-full flex items-center justify-between py-3 text-left border-b border-gray-100 hover:text-[#010744] transition-colors"
                  >
                    <span className="font-medium text-gray-700">{s.label}</span>
                    <ArrowRight size={14} className="text-gray-400" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Filtro por tipo */}
          <section className="pt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
              Por tipo de imóvel
            </h3>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTipo(t)
                    navigate(query, t)
                  }}
                  className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
                    tipo === t
                      ? 'bg-[#010744] text-white border-[#010744]'
                      : 'border-gray-200 text-gray-700 hover:border-[#010744] hover:text-[#010744]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
