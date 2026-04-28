'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'

interface MegaMenuColumn {
  heading: string
  links: { label: string; href: string }[]
}

interface MegaMenuProps {
  /** Texto do trigger (ex: "Comprar"). */
  label: string
  /** href do trigger quando clicado direto. */
  href: string
  /** Colunas de links exibidas no painel. */
  columns: MegaMenuColumn[]
  /** Card de destaque à direita (cidade em foco, lançamento, etc.). */
  highlight?: {
    title: string
    description: string
    href: string
    image?: string
  }
  /** Marca o trigger como ativo (rota atual está em `href`). */
  active?: boolean
  /** Passed from Header to adapt colors in liquid-glass transparent state. */
  isScrolled?: boolean
}

const OPEN_DELAY_MS = 120
const CLOSE_DELAY_MS = 250

export function HeaderMegaMenu({ label, href, columns, highlight, active, isScrolled = true }: MegaMenuProps) {
  const [open, setOpen] = useState(false)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  function clearTimers() {
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = null
    closeTimer.current = null
  }

  function scheduleOpen() {
    clearTimers()
    openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS)
  }

  function scheduleClose() {
    clearTimers()
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  // ESC fecha imediatamente
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        ;(containerRef.current?.querySelector('a, button') as HTMLElement | null)?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Cleanup timers on unmount
  useEffect(() => () => clearTimers(), [])

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onFocus={scheduleOpen}
      onBlur={(e) => {
        // Fechar somente se o foco saiu do contêiner
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          scheduleClose()
        }
      }}
    >
      <Link
        href={href}
        aria-haspopup="true"
        aria-expanded={open}
        className={[
          'inline-flex items-center gap-1 text-sm font-semibold transition-colors duration-200',
          isScrolled
            ? active
              ? 'text-[#010744] border-b-2 border-[#f2d22e] pb-0.5'
              : 'text-gray-600 hover:text-[#010744]'
            : active
            ? 'text-white border-b-2 border-[#f2d22e] pb-0.5'
            : 'text-white/80 hover:text-white',
        ].join(' ')}
      >
        {label}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </Link>

      {/* Painel — sempre montado p/ animar opacidade e translate */}
      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[min(900px,90vw)] z-50 transition-all duration-200 ${
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className={`grid ${highlight ? 'grid-cols-[1fr_280px]' : 'grid-cols-1'}`}>
            {/* Colunas */}
            <div className="grid grid-cols-3 gap-6 p-6">
              {columns.map((col) => (
                <div key={col.heading}>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#f2d22e] mb-3">
                    {col.heading}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          role="menuitem"
                          className="text-sm text-gray-700 hover:text-[#010744] transition-colors block py-1"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Card de destaque */}
            {highlight && (
              <Link
                href={highlight.href}
                role="menuitem"
                className="relative bg-[#010744] text-white p-6 flex flex-col justify-end gap-2 group overflow-hidden"
                style={{
                  backgroundImage: highlight.image ? `url(${highlight.image})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#010744]/95 via-[#010744]/60 to-[#010744]/30" />
                <div className="relative">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#f2d22e]">
                    Em destaque
                  </span>
                  <p className="text-lg font-bold leading-tight mt-1">{highlight.title}</p>
                  <p className="text-xs text-gray-200 leading-snug mt-1">{highlight.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-[#f2d22e] text-xs font-semibold mt-3 group-hover:translate-x-1 transition-transform">
                    Ver mais
                    <ArrowRight size={12} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
