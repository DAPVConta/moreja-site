'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { PROPERTY_TYPES } from '@/types/property'

const TABS = [
  { label: 'Comprar', value: 'comprar', finalidade: 'Venda' },
  { label: 'Alugar', value: 'alugar', finalidade: 'Locação' },
  { label: 'Empreendimentos', value: 'empreendimentos', finalidade: '' },
] as const

type TabValue = (typeof TABS)[number]['value']

export function HeroSearch() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>('comprar')
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (tipo) params.set('tipo', tipo)

    const base = activeTab === 'empreendimentos' ? '/empreendimentos' : `/${activeTab}`
    router.push(`${base}?${params.toString()}`)
  }

  const activeIndex = TABS.findIndex((t) => t.value === activeTab)

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Tabs — segmented control com pill amarela animada.
          Pill desliza com translateX baseado no índice ativo. */}
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
              className={`relative z-10 px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold whitespace-nowrap rounded-full transition-colors duration-200 ${
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
        className="bg-white rounded-2xl p-3 sm:p-4 md:p-5 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {/* Text search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bairro, cidade ou palavra-chave..."
              autoCapitalize="words"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-base sm:text-sm text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent
                         placeholder:text-gray-400"
              aria-label="Buscar imóveis"
            />
          </div>

          {/* Type select */}
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="sm:w-48 px-4 py-3 border border-gray-200 rounded-lg text-base sm:text-sm text-gray-700
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

          {/* Search button */}
          <button
            type="submit"
            className="btn-primary flex items-center justify-center gap-2 sm:px-8 min-h-[48px]"
          >
            <Search size={18} aria-hidden="true" />
            Buscar
          </button>
        </div>
      </form>
    </div>
  )
}
