'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, MapPin, Clock, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Command } from 'cmdk'
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

// ─── Static suggestion data ───────────────────────────────────────────────────

export interface SearchSuggestion {
  group: 'bairro' | 'cidade' | 'empreendimento'
  label: string
  value: string
}

const DEFAULT_SUGGESTIONS: SearchSuggestion[] = [
  // Bairros
  { group: 'bairro',         label: 'Boa Viagem',               value: 'Boa Viagem' },
  { group: 'bairro',         label: 'Pina',                     value: 'Pina' },
  { group: 'bairro',         label: 'Aflitos',                  value: 'Aflitos' },
  { group: 'bairro',         label: 'Casa Forte',               value: 'Casa Forte' },
  { group: 'bairro',         label: 'Graças',                   value: 'Graças' },
  { group: 'bairro',         label: 'Espinheiro',               value: 'Espinheiro' },
  // Cidades
  { group: 'cidade',         label: 'Recife',                   value: 'Recife' },
  { group: 'cidade',         label: 'Olinda',                   value: 'Olinda' },
  { group: 'cidade',         label: 'Jaboatão dos Guararapes',  value: 'Jaboatão dos Guararapes' },
  { group: 'cidade',         label: 'Camaragibe',               value: 'Camaragibe' },
  // Empreendimentos
  { group: 'empreendimento', label: 'Reserva Boa Viagem',       value: 'Reserva Boa Viagem' },
  { group: 'empreendimento', label: 'Morejá Prime',             value: 'Morejá Prime' },
  { group: 'empreendimento', label: 'Esplanada Residence',      value: 'Esplanada Residence' },
]

const GROUP_LABELS: Record<SearchSuggestion['group'], string> = {
  bairro:         'Bairros',
  cidade:         'Cidades',
  empreendimento: 'Empreendimentos',
}

const RECENT_KEY = 'moreja:recent-searches'
const MAX_RECENT  = 3

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function saveRecent(value: string) {
  if (typeof window === 'undefined') return
  try {
    const prev = loadRecent().filter((v) => v !== value)
    localStorage.setItem(RECENT_KEY, JSON.stringify([value, ...prev].slice(0, MAX_RECENT)))
  } catch {
    // silently ignore
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Comprar',         value: 'comprar',          finalidade: 'Venda' },
  { label: 'Alugar',          value: 'alugar',           finalidade: 'Locação' },
  { label: 'Empreendimentos', value: 'empreendimentos',  finalidade: '' },
] as const

type TabValue = (typeof TABS)[number]['value']

const ROOM_OPTIONS = ['1', '2', '3', '4+'] as const

// ─── Suggestion dropdown ──────────────────────────────────────────────────────

interface SuggestionDropdownProps {
  open: boolean
  query: string
  suggestions: SearchSuggestion[]
  recentSearches: string[]
  onSelect: (value: string) => void
  onClearRecent: () => void
  inputId: string
  listId: string
}

function SuggestionDropdown({
  open,
  query,
  suggestions,
  recentSearches,
  onSelect,
  onClearRecent,
  inputId,
  listId,
}: SuggestionDropdownProps) {
  const groups = (['bairro', 'cidade', 'empreendimento'] as const).filter((g) =>
    suggestions.some((s) => s.group === g)
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={listId}
          role="listbox"
          aria-label="Sugestões de busca"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="absolute left-0 right-0 top-full mt-1.5 z-50
                     bg-white rounded-xl shadow-xl border border-gray-100
                     max-h-72 overflow-y-auto"
        >
          <Command
            shouldFilter={false}
            aria-labelledby={inputId}
          >
            <Command.List>
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <Command.Group>
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                      Buscas recentes
                    </span>
                    <button
                      type="button"
                      onClick={onClearRecent}
                      className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]
                                 focus-visible:ring-offset-1 rounded"
                    >
                      Limpar
                    </button>
                  </div>
                  {recentSearches.map((v) => (
                    <Command.Item
                      key={`recent-${v}`}
                      value={`recent:${v}`}
                      role="option"
                      onSelect={() => onSelect(v)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700
                                 cursor-pointer hover:bg-gray-50
                                 data-[selected=true]:bg-[#010744]/5
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]
                                 focus-visible:ring-inset"
                    >
                      <Clock size={14} className="text-gray-400 shrink-0" aria-hidden="true" />
                      {v}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Suggestion groups */}
              {groups.map((group) => {
                const items = suggestions.filter((s) => s.group === group)
                if (items.length === 0) return null
                return (
                  <Command.Group key={group}>
                    <div className="px-3 pt-2.5 pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                        {GROUP_LABELS[group]}
                      </span>
                    </div>
                    {items.map((s) => (
                      <Command.Item
                        key={s.value}
                        value={s.value}
                        role="option"
                        onSelect={() => onSelect(s.value)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700
                                   cursor-pointer hover:bg-gray-50
                                   data-[selected=true]:bg-[#010744]/5
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]
                                   focus-visible:ring-inset"
                      >
                        <MapPin size={14} className="text-[#f2d22e] shrink-0" aria-hidden="true" />
                        {s.label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )
              })}

              {/* No results */}
              <Command.Empty className="px-3 py-4 text-sm text-gray-400 text-center">
                Nenhuma sugestão encontrada.
              </Command.Empty>
            </Command.List>
          </Command>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface HeroSearchProps {
  /**
   * Optional API-driven suggestions. When omitted, falls back to DEFAULT_SUGGESTIONS.
   * Future swap: pass result of /api/search-suggestions here.
   */
  suggestions?: SearchSuggestion[]
}

export function HeroSearch({ suggestions = DEFAULT_SUGGESTIONS }: HeroSearchProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>('comprar')
  const [query, setQuery]         = useState('')
  const [tipo, setTipo]           = useState('')
  const [quartos, setQuartos]     = useState<string>('')
  const [precoMin, setPrecoMin]   = useState('')
  const [precoMax, setPrecoMax]   = useState('')

  // Autocomplete state
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef  = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const inputId = 'hero-search-input'
  const listId  = 'hero-search-listbox'

  // Load recent searches on mount (client-only)
  useEffect(() => {
    setRecentSearches(loadRecent())
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Filter suggestions against current query
  const filtered: SearchSuggestion[] = query.trim().length >= 1
    ? suggestions.filter((s) =>
        s.label.toLowerCase().includes(query.toLowerCase())
      )
    : suggestions

  // Whether to show dropdown at all
  const showDropdown = dropdownOpen && (filtered.length > 0 || recentSearches.length > 0)

  const handleSelectSuggestion = useCallback((value: string) => {
    setQuery(value)
    saveRecent(value)
    setRecentSearches(loadRecent())
    setDropdownOpen(false)
    inputRef.current?.focus()
  }, [])

  const handleClearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_KEY)
    setRecentSearches([])
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      saveRecent(query.trim())
      setRecentSearches(loadRecent())
    }
    const params = new URLSearchParams()
    if (query)    params.set('q', query)
    if (tipo)     params.set('tipo', tipo)
    if (quartos)  params.set('quartos', quartos.replace('+', ''))
    if (precoMin) params.set('preco_min', precoMin)
    if (precoMax) params.set('preco_max', precoMax)

    const base = activeTab === 'empreendimentos' ? '/empreendimentos' : `/${activeTab}`
    router.push(`${base}?${params.toString()}`)
  }

  const activeFilterCount = [quartos, precoMin, precoMax].filter(Boolean).length

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* ── Tabs — Framer layoutId pill (Acao 4) ─────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Modalidade de busca"
        className="relative inline-flex p-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-3"
      >
        {/* The pill is a shared layout element that morphs between tab positions */}
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
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
            >
              {/* Framer layoutId pill — one instance rendered inside the active button
                  so it naturally follows width + position of each tab text */}
              {isActive && (
                <motion.span
                  layoutId="hero-tab-pill"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-[#f2d22e] shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Search form ───────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-2xl"
      >
        {/* Desktop (lg+): grid 5 cols — Location | Type | Rooms | Price | Submit */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_160px_220px_auto] gap-2.5 lg:gap-3">

          {/* ── Location with cmdk autocomplete ─────────────────────────────── */}
          <div className="relative" ref={wrapperRef}>
            <MapPin
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f2d22e] pointer-events-none z-10"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setDropdownOpen(false)
                  inputRef.current?.blur()
                }
              }}
              placeholder="Bairro, cidade ou palavra-chave..."
              autoCapitalize="words"
              autoComplete="off"
              spellCheck={false}
              aria-label="Buscar imóveis"
              aria-haspopup="listbox"
              aria-expanded={showDropdown}
              aria-controls={showDropdown ? listId : undefined}
              aria-autocomplete="list"
              className="w-full h-12 pl-10 pr-8 border border-gray-200 rounded-lg text-base lg:text-sm text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent
                         placeholder:text-gray-400"
            />
            {/* Clear button */}
            {query.length > 0 && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]
                           focus-visible:ring-offset-1 rounded transition-colors"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}

            {/* Dropdown */}
            <SuggestionDropdown
              open={showDropdown}
              query={query}
              suggestions={filtered}
              recentSearches={recentSearches}
              onSelect={handleSelectSuggestion}
              onClearRecent={handleClearRecent}
              inputId={inputId}
              listId={listId}
            />
          </div>

          {/* ── Type ─────────────────────────────────────────────────────────── */}
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

          {/* ── Rooms (desktop) ──────────────────────────────────────────────── */}
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

          {/* ── Price range (desktop) ─────────────────────────────────────────── */}
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

          {/* ── Mobile: Sheet com filtros ─────────────────────────────────────── */}
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

          {/* ── Submit ────────────────────────────────────────────────────────── */}
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
