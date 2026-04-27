'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  /** Valor original (ex: "500+", "98%", "10", "2.000+") */
  value: string
  /** Duração da animação em ms */
  duration?: number
  /** Margem do IntersectionObserver. Default '-80px'. */
  rootMargin?: string
}

/**
 * Anima de 0 ao número embutido em `value` quando entra no viewport.
 * Preserva sufixos não-numéricos ("+", "%", "k", etc.) e separadores
 * ("." em pt-BR como milhar). Em prefers-reduced-motion, mostra o
 * valor final imediatamente.
 */
export function AnimatedNumber({
  value,
  duration = 1400,
  rootMargin = '-80px',
}: AnimatedNumberProps) {
  // Extrai a parte numérica (com . como milhar, , como decimal pt-BR)
  // e os sufixos. Ex: "2.000+" → numeric=2000, suffix="+"; "98%" → 98, "%"
  const match = value.match(/^([\d.,]+)(.*)$/)
  const numericString = match?.[1] ?? ''
  const suffix = match?.[2] ?? ''

  const target = parseFloat(numericString.replace(/\./g, '').replace(',', '.'))
  const isAnimatable = Number.isFinite(target) && target > 0

  const ref = useRef<HTMLSpanElement | null>(null)
  const [display, setDisplay] = useState<string>(isAnimatable ? '0' : value)

  useEffect(() => {
    if (!isAnimatable) return
    const el = ref.current
    if (!el) return

    if (typeof window !== 'undefined') {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduceMotion) {
        setDisplay(value)
        return
      }
    }

    if (typeof IntersectionObserver === 'undefined') {
      setDisplay(value)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const start = performance.now()
        let raf = 0
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          // easeOutCubic
          const eased = 1 - Math.pow(1 - t, 3)
          const current = target * eased

          // Re-aplica formatação pt-BR ao número original
          const formatted = formatNumber(current, numericString)
          setDisplay(formatted + suffix)

          if (t < 1) raf = requestAnimationFrame(tick)
          else setDisplay(value) // garante valor exato no fim
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
      },
      { rootMargin, threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration, rootMargin, target, suffix, numericString, isAnimatable])

  return <span ref={ref}>{display}</span>
}

function formatNumber(current: number, original: string) {
  // Sem decimais → formata com . como milhar (pt-BR)
  const hasDecimal = original.includes(',')
  if (!hasDecimal) {
    return Math.round(current).toLocaleString('pt-BR')
  }
  return current.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
