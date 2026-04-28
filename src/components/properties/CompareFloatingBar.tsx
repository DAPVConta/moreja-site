'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GitCompare, X, ArrowRight } from 'lucide-react'
import {
  readCompare,
  clearCompare,
  COMPARE_EVENT,
  type CompareProperty,
} from '@/lib/compare'

/**
 * Pílula flutuante no canto inferior direito com contador de itens no
 * comparador. Aparece só quando há 1+ items. Click leva para /comparar.
 *
 * Plug global no layout (próximo ao WhatsAppFab).
 */
export function CompareFloatingBar() {
  const [items, setItems] = useState<CompareProperty[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setItems(readCompare())
    const onChange = () => setItems(readCompare())
    window.addEventListener(COMPARE_EVENT, onChange)
    return () => window.removeEventListener(COMPARE_EVENT, onChange)
  }, [])

  if (!mounted || items.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Comparador de imóveis"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-[#010744]
                 pl-4 pr-1 py-1 shadow-2xl ring-1 ring-white/10
                 sm:bottom-6 animate-in slide-in-from-bottom-4 duration-300"
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
    >
      <span className="flex items-center gap-2 text-white">
        <GitCompare size={16} className="text-[#f2d22e]" aria-hidden="true" />
        <span className="text-sm font-semibold">
          Comparar {items.length}
        </span>
      </span>
      <button
        type="button"
        onClick={clearCompare}
        aria-label="Limpar comparador"
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={14} />
      </button>
      <Link
        href="/comparar"
        className="inline-flex items-center gap-1.5 rounded-full bg-[#f2d22e] px-4 py-2 text-sm font-bold text-[#010744]
                   transition-colors hover:brightness-105 active:scale-[0.98]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Ver
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}
