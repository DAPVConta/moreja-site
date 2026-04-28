'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, MapPin } from 'lucide-react'
import { PROPERTY_TYPES } from '@/types/property'
import { Button } from '@/components/ui/Button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/Sheet'

const TABS = [
  { label: 'Comprar', value: 'comprar', finalidade: 'Venda' },
  { label: 'Alugar', value: 'alugar', finalidade: 'Locação' },
  { label: 'Empreendimentos', value: 'empreendimentos', finalidade: '' },
] as const

type TabValue = (typeof TABS)[number]['value']

const ROOM_OPTIONS = ['1', '2', '3', '4+'] as const

export function HeroSearch() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>('comprar')
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState('')
  const [quartos, setQuartos] = useState<string>('')
  const [precoMin, setPrecoMin] = useState('')
  const [precoMax, setPrecoMax] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (tipo) params.set('tipo', tipo)
    if (quartos) params.set('quartos', quartos.replace('+', ''))
    if (precoMin) params.set('preco_min', precoMin)
    if (precoMax) params.set('preco_max', precoMax)

    const base = activeTab === 'empreendimentos' ? '/empreendimentos' : `/${activeTab}`
    router.push(`${base}?${params.toString()}`)
  }

  const activeIndex = TABS.findIndex((t) => t.value === activeTab)

  // Conta filtros ativos para o badge no botão "Filtros"
  const activeFilterCount = [quartos, precoMin, precoMax].filter(Boolean).length

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Tabs — segmented control com pill amarela animada */}
      <div
        role="tablist"
        aria-label="Modalidade de busca"
        className="relative inline-flex p-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-3"
      >
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-1 rounded-full bg-[#f2d22e] shadow-md transition-transform duration-300 ease-out"
          style={{
            width: `calc((100% - 0.5rem) / ${TABS.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.value)}
              className={`relative z-10 min-h-[44px] px-4 sm:px-6 text-xs sm:text-sm font-bold whitespace-nowrap rounded-full transition-colors duration-200 ${
                isActive ? 'text-[#010744]' : 'text-white hover:text-white/90'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-2xl"
      >
        {/* Desktop (lg+): grid 5 colunas — Location | Type | Rooms | Price | Submit */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_160px_220px_auto] gap-2.5 lg:gap-3">
          {/* Location */}
          <div className="relative">
            <MapPin
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f2d22e]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bairro, cidade ou palavra-chave..."
              autoCapitalize="words"
              className="w-full h-12 pl-10 pr-4 border border-gray-200 rounded-lg text-base lg:text-sm text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent
                         placeholder:text-gray-400"
              aria-label="Buscar imóveis"
            />
          </div>

          {/* Type */}
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="h-12 px-3 border border-gray-200 rounded-lg text-base lg:text-sm text-gray-700
                       focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent
                       bg-white cursor-pointer"
            aria-label="Tipo de imóvel"
          >
            <option value="">Tipo de imóvel</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Rooms — desktop: select compacto; mobile: parte do sheet */}
          <select
            value={quartos}
            onChange={(e) => setQuartos(e.target.value)}
            className="hidden lg:block h-12 px-3 border border-gray-200 rounded-lg text-base lg:text-sm text-gray-700
                       focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent
                       bg-white cursor-pointer"
            aria-label="Número de quartos"
          >
            <option value="">Quartos</option>
            {ROOM_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} quarto{r === '1' ? '' : 's'}
              </option>
            ))}
          </select>

          {/* Price range — desktop: 2 inputs lado-a-lado */}
          <div className="hidden lg:grid grid-cols-2 gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              value={precoMin}
              onChange={(e) => setPrecoMin(e.target.value)}
              placeholder="Mín"
              className="h-12 px-3 border border-gray-200 rounded-lg text-sm text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent
                         placeholder:text-gray-400"
              aria-label="Preço mínimo"
            />
            <input
              type="number"
              inputMode="numeric"
              value={precoMax}
              onChange={(e) => setPrecoMax(e.target.value)}
              placeholder="Máx"
              className="h-12 px-3 border border-gray-200 rounded-lg text-sm text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent
                         placeholder:text-gray-400"
              aria-label="Preço máximo"
            />
          </div>

          {/* Mobile: botão "Filtros" abre Sheet com Quartos + Preço */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="lg:hidden inline-flex items-center justify-center gap-2 h-12 px-4
                           border border-gray-200 rounded-lg text-sm font-semibold text-[#010744]
                           bg-white hover:bg-gray-50 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#010744]"
                aria-label={`Abrir filtros avançados${activeFilterCount > 0 ? ` (${activeFilterCount} ativos)` : ''}`}
              >
                <SlidersHorizontal size={18} />
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#f2d22e] text-[#010744] text-[11px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Filtros avançados</SheetTitle>
                <SheetDescription>
                  Refine sua busca por número de quartos e faixa de preço.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#010744] mb-3">
                    Quartos
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {ROOM_OPTIONS.map((r) => {
                      const isActive = quartos === r
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setQuartos(isActive ? '' : r)}
                          className={`min-h-[44px] min-w-[60px] px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                            isActive
                              ? 'border-[#010744] bg-[#010744] text-white'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-[#010744]'
                          }`}
                          aria-pressed={isActive}
                        >
                          {r}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#010744] mb-3">
                    Faixa de preço (R$)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={precoMin}
                      onChange={(e) => setPrecoMin(e.target.value)}
                      placeholder="Mínimo"
                      className="h-12 px-3 border border-gray-200 rounded-lg text-base text-gray-700
                                 focus:outline-none focus:ring-2 focus:ring-[#010744]"
                      aria-label="Preço mínimo"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={precoMax}
                      onChange={(e) => setPrecoMax(e.target.value)}
                      placeholder="Máximo"
                      className="h-12 px-3 border border-gray-200 rounded-lg text-base text-gray-700
                                 focus:outline-none focus:ring-2 focus:ring-[#010744]"
                      aria-label="Preço máximo"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex gap-2 border-t border-gray-100 bg-white px-6 pb-6 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setQuartos('')
                    setPrecoMin('')
                    setPrecoMax('')
                  }}
                  className="flex-1 min-h-[48px] rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-700
                             hover:border-gray-300 transition-colors"
                >
                  Limpar
                </button>
                <SheetClose asChild>
                  <Button type="button" variant="primary" size="lg" className="flex-1">
                    Aplicar
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="lg:px-8 min-h-[48px]"
          >
            <Search size={18} aria-hidden="true" />
            Buscar
          </Button>
        </div>
      </form>
    </div>
  )
}
