'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, ArrowRight, X } from 'lucide-react'
import {
  readRecentlyViewed,
  clearRecentlyViewed,
  type RecentlyViewedProperty,
} from '@/lib/recently-viewed'
import { formatPrice } from '@/lib/format'

interface RecentlyViewedSectionProps {
  title?: string
  subtitle?: string
}

/**
 * Renderiza nada se não houver histórico — não afeta a home pra novos
 * visitantes (SSR-safe via mount-after-hydration).
 */
export function RecentlyViewedSection({
  title = 'Vistos recentemente',
  subtitle = 'Continue de onde parou — você visitou esses imóveis há pouco.',
}: RecentlyViewedSectionProps) {
  const [items, setItems] = useState<RecentlyViewedProperty[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setItems(readRecentlyViewed())
    const onChange = () => setItems(readRecentlyViewed())
    window.addEventListener('moreja:recently-viewed-changed', onChange)
    return () => window.removeEventListener('moreja:recently-viewed-changed', onChange)
  }, [])

  if (!mounted || items.length === 0) return null

  return (
    <section className="section-tight bg-white border-b border-gray-100">
      <div className="container-page">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#f2d22e] mb-2">
              <Clock size={12} aria-hidden="true" />
              Histórico
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#010744] leading-tight">
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1 hidden sm:block">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearRecentlyViewed()
              setItems([])
            }}
            className="text-xs text-gray-400 hover:text-[#010744] font-medium underline-offset-2 hover:underline shrink-0"
          >
            Limpar histórico
          </button>
        </div>

        <div
          className="
            -mx-4 sm:mx-0 px-4 sm:px-0
            flex gap-3 sm:gap-4
            overflow-x-auto snap-x snap-mandatory
            scroll-smooth scrollbar-thin pb-3
          "
        >
          {items.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className="snap-start shrink-0 w-[260px] sm:w-[280px] group rounded-xl overflow-hidden
                         bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {p.foto ? (
                  <Image
                    src={p.foto}
                    alt={p.titulo}
                    fill
                    sizes="280px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
                    Sem foto
                  </div>
                )}
                <span className="absolute top-2 left-2 inline-block rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#010744]">
                  {p.finalidade}
                </span>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-[#010744] line-clamp-1 mb-0.5">
                  {p.titulo}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {p.bairro}{p.bairro && p.cidade ? ', ' : ''}{p.cidade}
                </p>
                <p className="mt-2 text-base font-bold text-[#010744]">
                  {formatPrice(p.preco)}
                  {p.finalidade === 'Locação' && (
                    <span className="text-[11px] font-normal text-gray-400">/mês</span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
