'use client'

/**
 * CommandPalette — Fase 9
 *
 * Global Cmd+K / Ctrl+K command palette powered by cmdk.
 * Groups: buscas recentes → atalhos rápidos → páginas.
 *
 * localStorage key `moreja:recent-searches` is shared with HeroSearch
 * (same MAX_RECENT=3 cap).
 *
 * cmdk v1 CommandDialog provides:
 *   - Radix Dialog portal (focus trap, aria-modal, Escape closes)
 *   - Arrow-key navigation
 *   - shouldFilter=true (built-in fuzzy by default)
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from 'cmdk'
import {
  Search,
  Home,
  Key,
  TrendingUp,
  Building2,
  MessageCircle,
  Info,
  Phone,
  Clock,
  ArrowRight,
  MapPin,
} from 'lucide-react'

// ── localStorage helpers (same key/cap as HeroSearch) ────────────────────────

const RECENT_KEY = 'moreja:recent-searches'
const MAX_RECENT = 3

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? (parsed as unknown[])
          .filter((s): s is string => typeof s === 'string')
          .slice(0, MAX_RECENT)
      : []
  } catch {
    return []
  }
}

// ── Static action/page data ───────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    id: 'comprar',
    label: 'Buscar imóveis para comprar',
    icon: Home,
    href: '/comprar',
    external: false,
  },
  {
    id: 'alugar',
    label: 'Buscar imóveis para alugar',
    icon: Key,
    href: '/alugar',
    external: false,
  },
  {
    id: 'avaliar',
    label: 'Avaliar meu imóvel',
    icon: TrendingUp,
    href: '/avaliar',
    external: false,
  },
  {
    id: 'empreendimentos',
    label: 'Empreendimentos',
    icon: Building2,
    href: '/empreendimentos',
    external: false,
  },
  {
    id: 'whatsapp',
    label: 'Falar pelo WhatsApp',
    icon: MessageCircle,
    href: 'https://wa.me/5581999999999',
    external: true,
  },
] as const

const PAGE_LINKS = [
  { id: 'sobre',   label: 'Sobre nós',        icon: Info,   href: '/sobre' },
  { id: 'contato', label: 'Contato',           icon: Phone,  href: '/contato' },
  { id: 'bairros', label: 'Bairros em Recife', icon: MapPin, href: '/comprar?cidade=recife' },
] as const

// ── Shared item class (Tailwind string) ──────────────────────────────────────

const ITEM_CLASS = [
  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm text-gray-700',
  'cursor-pointer transition-colors duration-100',
  'hover:bg-gray-50',
  'data-[selected=true]:bg-[#010744] data-[selected=true]:text-white',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-1',
].join(' ')

const GROUP_HEADING_CLASS = [
  '[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5',
  '[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold',
  '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest',
  '[&_[cmdk-group-heading]]:text-gray-400',
].join(' ')

// ── Component ─────────────────────────────────────────────────────────────────

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Refresh recents each time the palette opens
  useEffect(() => {
    if (open) setRecentSearches(loadRecent())
  }, [open])

  // Global Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const navigate = useCallback(
    (href: string, external = false) => {
      setOpen(false)
      if (external) {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else {
        router.push(href)
      }
    },
    [router],
  )

  const runRecentSearch = useCallback(
    (term: string) => {
      setOpen(false)
      router.push(`/comprar?q=${encodeURIComponent(term)}`)
    },
    [router],
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      aria-label="Paleta de comandos — busca e atalhos"
      overlayClassName="fixed inset-0 z-[var(--z-modal,70)] bg-black/30 backdrop-blur-md"
      contentClassName={[
        'fixed left-1/2 top-[18vh] -translate-x-1/2',
        'z-[calc(var(--z-modal,70)+1)]',
        'w-[min(600px,calc(100vw-2rem))]',
        'bg-white rounded-2xl shadow-2xl shadow-[#010744]/20',
        'border border-gray-100 overflow-hidden',
        'focus:outline-none',
      ].join(' ')}
    >
      {/* ── Input ── */}
      <div className="flex items-center gap-3 px-4 border-b border-gray-100 h-14">
        <Search size={18} className="text-gray-400 shrink-0" aria-hidden="true" />
        <CommandInput
          placeholder="Buscar imóveis, páginas, atalhos..."
          className="flex-1 h-full bg-transparent text-base text-gray-800
                     placeholder:text-gray-400 outline-none border-none ring-0 focus:ring-0"
          aria-label="Buscar"
        />
        <kbd
          aria-label="Pressione Escape para fechar"
          className="hidden sm:inline-flex items-center justify-center h-6 px-2 rounded
                     border border-gray-200 text-[11px] font-medium text-gray-400 bg-gray-50"
        >
          Esc
        </kbd>
      </div>

      {/* ── Results ── */}
      <CommandList
        className="max-h-[min(420px,55vh)] overflow-y-auto overscroll-contain py-2"
        aria-label="Resultados"
      >
        <CommandEmpty className="px-4 py-8 text-center text-sm text-gray-400">
          Nenhum resultado encontrado.
        </CommandEmpty>

        {/* Buscas recentes */}
        {recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Buscas recentes" className={GROUP_HEADING_CLASS}>
              {recentSearches.map((term) => (
                <CommandItem
                  key={`recent-${term}`}
                  value={`recent ${term}`}
                  onSelect={() => runRecentSearch(term)}
                  className={ITEM_CLASS}
                >
                  <Clock size={15} className="shrink-0 opacity-60" aria-hidden="true" />
                  <span className="flex-1 truncate">{term}</span>
                  <ArrowRight size={13} className="shrink-0 opacity-30" aria-hidden="true" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator className="my-1 h-px bg-gray-100 mx-4" />
          </>
        )}

        {/* Atalhos rápidos */}
        <CommandGroup heading="Atalhos rápidos" className={GROUP_HEADING_CLASS}>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <CommandItem
                key={action.id}
                value={action.label}
                onSelect={() => navigate(action.href, action.external)}
                className={ITEM_CLASS}
              >
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-[#010744]/8 shrink-0
                             data-[selected=true]:bg-white/15"
                  aria-hidden="true"
                >
                  <Icon size={15} className="text-[#010744]" />
                </span>
                <span className="flex-1">{action.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator className="my-1 h-px bg-gray-100 mx-4" />

        {/* Páginas */}
        <CommandGroup heading="Páginas" className={GROUP_HEADING_CLASS}>
          {PAGE_LINKS.map((page) => {
            const Icon = page.icon
            return (
              <CommandItem
                key={page.id}
                value={page.label}
                onSelect={() => navigate(page.href)}
                className={ITEM_CLASS}
              >
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 shrink-0"
                  aria-hidden="true"
                >
                  <Icon size={15} className="text-gray-500" />
                </span>
                <span className="flex-1">{page.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>

      {/* ── Footer legend ── */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 bg-gray-50/70"
        aria-hidden="true"
      >
        {[
          { keys: ['↑', '↓'], label: 'navegar' },
          { keys: ['↵'], label: 'selecionar' },
          { keys: ['Esc'], label: 'fechar' },
        ].map(({ keys, label }) => (
          <span key={label} className="flex items-center gap-1 text-[11px] text-gray-400">
            {keys.map((k) => (
              <kbd
                key={k}
                className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5
                           rounded border border-gray-200 text-[10px] font-medium text-gray-500 bg-white"
              >
                {k}
              </kbd>
            ))}
            <span>{label}</span>
          </span>
        ))}
        <span className="ml-auto text-[11px] text-gray-400 hidden sm:block">
          <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded border border-gray-200
                          text-[10px] font-medium text-gray-500 bg-white mr-1">
            ⌘K
          </kbd>
          para abrir
        </span>
      </div>
    </CommandDialog>
  )
}
