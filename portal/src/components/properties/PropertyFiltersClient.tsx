'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { SlidersHorizontal, X, Search } from 'lucide-react'

interface PriceRange {
  label: string
  min: number
  max: number
}

interface PropertyFiltersClientProps {
  initialParams: {
    q?: string
    tipo?: string
    bairro?: string
    cidade?: string
    preco_min?: string
    preco_max?: string
    quartos?: string
    order?: string
  }
  finalidade: 'Venda' | 'Locação'
  propertyTypes: string[]
  priceRanges: PriceRange[]
}

export function PropertyFiltersClient({
  initialParams,
  propertyTypes,
  priceRanges,
}: PropertyFiltersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [mobileOpen, setMobileOpen] = useState(false)

  const [q, setQ] = useState(initialParams.q ?? '')
  const [tipo, setTipo] = useState(initialParams.tipo ?? '')
  const [bairro, setBairro] = useState(initialParams.bairro ?? '')
  const [cidade, setCidade] = useState(initialParams.cidade ?? '')
  const [precoMin, setPrecoMin] = useState(initialParams.preco_min ?? '')
  const [precoMax, setPrecoMax] = useState(initialParams.preco_max ?? '')
  const [quartos, setQuartos] = useState(initialParams.quartos ?? '')

  const hasActiveFilters = !!(tipo || bairro || cidade || precoMin || precoMax || quartos || q)

  function applyFilters() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (tipo) params.set('tipo', tipo)
    if (bairro) params.set('bairro', bairro)
    if (cidade) params.set('cidade', cidade)
    if (precoMin) params.set('preco_min', precoMin)
    if (precoMax) params.set('preco_max', precoMax)
    if (quartos) params.set('quartos', quartos)
    if (initialParams.order) params.set('order', initialParams.order)
    params.set('page', '1')

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
      setMobileOpen(false)
    })
  }

  function clearFilters() {
    setQ('')
    setTipo('')
    setBairro('')
    setCidade('')
    setPrecoMin('')
    setPrecoMax('')
    setQuartos('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  function handlePriceRange(range: PriceRange) {
    setPrecoMin(range.min > 0 ? String(range.min) : '')
    setPrecoMax(range.max > 0 ? String(range.max) : '')
  }

  const filterContent = (
    <div className={`space-y-5 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Search */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Buscar
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Bairro, cidade, código..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent"
          />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Tipo de imóvel
        </label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent bg-white"
        >
          <option value="">Todos os tipos</option>
          {propertyTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Bairro */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Bairro
        </label>
        <input
          type="text"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          placeholder="Digite o bairro"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent"
        />
      </div>

      {/* Cidade */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Cidade
        </label>
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Digite a cidade"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent"
        />
      </div>

      {/* Faixa de preço */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Faixa de preço
        </label>
        <div className="space-y-1">
          {priceRanges.map((range) => {
            const isActive =
              String(range.min || '') === precoMin && String(range.max || '') === precoMax
            return (
              <button
                key={range.label}
                type="button"
                onClick={() => handlePriceRange(range)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#010744] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            )
          })}
        </div>
        {(precoMin || precoMax) && (
          <button
            type="button"
            onClick={() => {
              setPrecoMin('')
              setPrecoMax('')
            }}
            className="mt-1 text-xs text-[#010744] underline"
          >
            Limpar faixa
          </button>
        )}
      </div>

      {/* Quartos */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Quartos
        </label>
        <div className="flex gap-2">
          {['', '1', '2', '3', '4'].map((q_) => (
            <button
              key={q_ || 'todos'}
              type="button"
              onClick={() => setQuartos(q_)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                quartos === q_
                  ? 'bg-[#010744] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {q_ === '' ? 'Todos' : q_ === '4' ? '4+' : q_}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={applyFilters}
          className="w-full py-2.5 bg-[#f2d22e] text-[#010744] font-semibold rounded-lg hover:bg-[#e6c820] transition-colors"
        >
          {isPending ? 'Buscando...' : 'Aplicar Filtros'}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="w-full py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-3.5 h-3.5" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#010744] text-white rounded-lg font-medium text-sm"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-[#f2d22e] text-[#010744] text-xs font-bold px-1.5 py-0.5 rounded-full">
              •
            </span>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 ml-auto w-80 max-w-full bg-white h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-5">
          <SlidersHorizontal className="w-4 h-4 text-[#010744]" />
          <h2 className="font-semibold text-gray-800">Filtros</h2>
          {hasActiveFilters && (
            <span className="ml-auto text-xs text-[#010744] font-medium bg-blue-50 px-2 py-0.5 rounded-full">
              Ativos
            </span>
          )}
        </div>
        {filterContent}
      </div>
    </>
  )
}
