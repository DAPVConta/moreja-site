'use client'

/**
 * BackToTopFab — botão circular fixo que sobe ao topo da página.
 *
 * - Aparece após scroll > 80% da altura total do documento.
 * - Smooth scroll com fallback instantâneo se prefers-reduced-motion.
 * - Posicionado acima do WhatsApp FAB (bottom ~5rem) sem colisão.
 * - iOS safe-area-inset-bottom via calc() no style inline.
 * - Focus-visible: anel amarelo 2px + offset-2.
 * - Touch target: w-12 h-12 (48×48px ≥ 44×44 mínimo Apple HIG).
 */

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function BackToTopFab() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      // Aparece quando o usuário scrollou mais de 80% do documento
      setVisible(docHeight > 0 && scrolled / docHeight > 0.8)
    }

    // Verifica imediatamente e adiciona listener passivo
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTop() {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className={[
        // Layout & shape
        'fixed z-40 right-4 sm:right-6',
        'flex items-center justify-center',
        'w-12 h-12 rounded-full',
        // Visual — amarelo distingue do verde do WhatsApp FAB
        'bg-[#f2d22e] text-[#010744]',
        'shadow-lg shadow-[#010744]/20',
        // Hover
        'hover:brightness-105 hover:shadow-xl hover:shadow-[#010744]/25',
        // Active feedback tátil
        'active:scale-[0.95]',
        // Transition ≤ 200ms
        'transition-all duration-200',
        // Focus ring amarelo
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2',
        // Cursor
        'cursor-pointer',
        // Show/hide via opacity + scale (sem layout shift)
        visible
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-75 pointer-events-none',
      ].join(' ')}
      style={{
        // WhatsApp FAB ocupa bottom-4/6 (1rem/1.5rem) + h-14/16 (3.5/4rem) = ~5/5.5rem.
        // Adicionamos gap de 0.75rem para separação confortável.
        bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <ArrowUp size={20} strokeWidth={2.5} aria-hidden="true" />
    </button>
  )
}
