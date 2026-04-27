'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Delay em ms antes da animação iniciar */
  delay?: number
  /** Distância em px do translate-y inicial. Default 16. */
  offset?: number
  /** rootMargin do IntersectionObserver. Default '0px 0px -10% 0px'. */
  rootMargin?: string
  /** Classe extra para o wrapper */
  className?: string
}

/**
 * Wrapper que faz fade-in + slide-up quando o elemento entra no
 * viewport. Usa IntersectionObserver — sem libs. Respeita
 * prefers-reduced-motion via CSS global em globals.css que já
 * neutraliza transitions com duration ≤ 0.01ms.
 */
export function Reveal({
  children,
  delay = 0,
  offset = 16,
  rootMargin = '0px 0px -10% 0px',
  className = '',
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold: 0.05 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transform: shown ? 'translateY(0)' : `translateY(${offset}px)`,
        opacity: shown ? 1 : 0,
      }}
      className={`transition-all duration-700 ease-out ${className}`}
    >
      {children}
    </div>
  )
}
