'use client'

/**
 * Sparkline — SVG trend line para usar atrás de números (ex: StatsSection).
 *
 * Renderiza um <svg> puramente decorativo (aria-hidden) com um <path>
 * animado via stroke-dashoffset quando entra no viewport.
 *
 * @example
 * ```tsx
 * <Sparkline points={[10, 30, 50, 70, 90, 95, 98]} color="yellow" />
 * // Fallback: se points ausente, gera curva ease-out de 8 pontos até 100
 * <Sparkline />
 * ```
 */

import { useEffect, useRef, useState } from 'react'

export interface SparklineProps {
  /**
   * 4–12 valores numéricos relativos (não precisam ser percentuais — são
   * normalizados internamente para o viewBox).
   * Se omitido, gera automaticamente 8 pontos em curva ease-out até 100.
   */
  points?: number[]
  /** Cor da linha. 'yellow' usa #f2d22e, 'navy' usa #010744. Default 'yellow'. */
  color?: 'yellow' | 'navy'
  /** Opacidade da linha (0–1). Default 0.13. */
  opacity?: number
  /** Largura da linha. Default 1.5. */
  strokeWidth?: number
  /** Duração da animação de entrada em ms. Default 900. */
  duration?: number
  /** rootMargin para IntersectionObserver. Default '0px 0px -5% 0px'. */
  rootMargin?: string
  /** className para o elemento <svg> */
  className?: string
}

// Gera 8 pontos em curva ease-out terminando próximo a 100
function generateEaseOutPoints(count = 8): number[] {
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    // easeOutCubic: 1 - (1-t)^3
    const eased = 1 - Math.pow(1 - t, 3)
    // Adiciona pequeno ruído para parecer orgânico (±4% de variação)
    const noise = i > 0 && i < count - 1 ? (Math.sin(i * 2.4) * 0.04) : 0
    return Math.max(0, Math.min(1, eased + noise)) * 100
  })
}

// Converte array de valores em path SVG suavizado (cubic bezier)
function pointsToPath(pts: number[], w: number, h: number): string {
  if (pts.length < 2) return ''

  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1

  // Normaliza para [0, 1] e mapeia para coordenadas SVG
  const coords = pts.map((v, i) => ({
    x: (i / (pts.length - 1)) * w,
    // Invertido: menor valor = baixo no SVG
    y: h - ((v - min) / range) * h * 0.8 - h * 0.1,
  }))

  // Cubic bezier suavizado (Catmull-Rom → Bezier)
  let d = `M ${coords[0].x},${coords[0].y}`
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[Math.min(coords.length - 1, i + 2)]

    // Catmull-Rom control points (tension 0.4)
    const t = 0.4
    const cp1x = p1.x + (p2.x - p0.x) * t
    const cp1y = p1.y + (p2.y - p0.y) * t
    const cp2x = p2.x - (p3.x - p1.x) * t
    const cp2y = p2.y - (p3.y - p1.y) * t

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }

  return d
}

const COLORS = {
  yellow: '#f2d22e',
  navy: '#010744',
} as const

export function Sparkline({
  points,
  color = 'yellow',
  opacity = 0.13,
  strokeWidth = 1.5,
  duration = 900,
  rootMargin = '0px 0px -5% 0px',
  className = '',
}: SparklineProps) {
  const W = 120
  const H = 40

  const resolvedPoints = points && points.length >= 2 ? points : generateEaseOutPoints(8)
  const pathData = pointsToPath(resolvedPoints, W, H)

  const pathRef = useRef<SVGPathElement | null>(null)
  const [animated, setAnimated] = useState(false)
  const [pathLength, setPathLength] = useState(0)

  // Mede o comprimento real do path depois do mount
  useEffect(() => {
    const el = pathRef.current
    if (!el) return
    const len = el.getTotalLength()
    setPathLength(len)
  }, [pathData])

  // Dispara animação via IntersectionObserver
  useEffect(() => {
    const el = pathRef.current
    if (!el || pathLength === 0) return

    // Respeita prefers-reduced-motion
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setAnimated(true)
        return
      }
    }

    if (typeof IntersectionObserver === 'undefined') {
      setAnimated(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [pathLength, rootMargin])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      preserveAspectRatio="none"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <path
        ref={pathRef}
        d={pathData}
        fill="none"
        stroke={COLORS[color]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        style={
          pathLength > 0
            ? {
                strokeDasharray: pathLength,
                strokeDashoffset: animated ? 0 : pathLength,
                transition: animated
                  ? `stroke-dashoffset ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`
                  : 'none',
              }
            : undefined
        }
      />
    </svg>
  )
}
