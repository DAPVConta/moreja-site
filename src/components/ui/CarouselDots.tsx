'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface CarouselDotsProps {
  /** Aria label do carousel. */
  ariaLabel?: string
  /** className aplicado ao container interno (que carrega scroll/snap). */
  className?: string
  /** Em quais breakpoints mostrar os dots. Default: só mobile (`sm:hidden`). */
  dotsVisibleClass?: string
  /** Filhos (snap items). */
  children: ReactNode
}

/**
 * Wrapper client-only que adiciona dots de paginação a um carousel
 * snap-x/overflow-x.
 *
 * • Usa IntersectionObserver para detectar item ativo (sem scroll listener)
 * • Tap target dos dots ≥24px (mobile-friendly)
 * • Click no dot scrolla até o item correspondente
 * • Fallback gracioso: até hidratar, só renderiza children sem dots
 */
export function CarouselDots({
  ariaLabel = 'Carrossel',
  className = '',
  dotsVisibleClass = 'sm:hidden',
  children,
}: CarouselDotsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return

    // Identifica os snap items: filhos diretos do container scroll
    const items = Array.from(root.children) as HTMLElement[]
    setCount(items.length)
    if (items.length <= 1) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) {
          const idx = items.indexOf(visible[0].target as HTMLElement)
          if (idx >= 0) setActiveIdx(idx)
        }
      },
      { root, threshold: [0.5, 0.75, 1.0] }
    )

    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [children])

  function scrollTo(idx: number) {
    const root = scrollRef.current
    if (!root) return
    const target = root.children[idx] as HTMLElement | undefined
    target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <>
      <div
        ref={scrollRef}
        className={className}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
      >
        {children}
      </div>

      {count > 1 && (
        <div
          className={`mt-4 flex items-center justify-center gap-2 ${dotsVisibleClass}`}
          role="tablist"
          aria-label="Navegação do carrossel"
        >
          {Array.from({ length: count }).map((_, idx) => {
            const isActive = idx === activeIdx
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Item ${idx + 1} de ${count}`}
                onClick={() => scrollTo(idx)}
                className="flex h-6 w-6 items-center justify-center"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-200 ${
                    isActive ? 'w-6 bg-[#010744]' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
