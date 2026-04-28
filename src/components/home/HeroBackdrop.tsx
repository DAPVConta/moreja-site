'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface HeroBackdropProps {
  bgImage?: string
  bgFocalX?: number
  bgFocalY?: number
  overlayOpacity?: number
}

/**
 * Camada de fundo do hero com parallax leve no desktop (lg+).
 * Em mobile, prefers-reduced-motion ou tela < 1024px, o background
 * fica estático (sem custo de scroll listener).
 */
export function HeroBackdrop({
  bgImage,
  bgFocalX = 50,
  bgFocalY = 50,
  overlayOpacity = 0.55,
}: HeroBackdropProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (reduceMotion || !isDesktop) return

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // Parallax leve: ~12% da rolagem. Limitado para não exceder
        // o tamanho do hero (que é ~720px no desktop).
        const y = Math.min(window.scrollY * 0.12, 120)
        setOffset(y)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  if (!bgImage) {
    return (
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#010744] via-[#010744] to-[#1a1f6e]"
        aria-hidden="true"
      />
    )
  }

  return (
    <>
      {/* bg ampliado em 110% para esconder a translateY até 120px.
          next/image com priority + fetchPriority="high" — otimização de LCP:
          o navegador descobre a imagem direto do HTML inicial e baixa em
          paralelo (vs. background-image que só dispara após CSS parse). */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -bottom-32 will-change-transform overflow-hidden"
        style={{ transform: `translate3d(0, ${offset}px, 0)` }}
      >
        <Image
          src={bgImage}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: `${bgFocalX}% ${bgFocalY}%` }}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, rgba(1,7,68,${overlayOpacity + 0.2}) 0%, rgba(1,7,68,${overlayOpacity}) 60%, rgba(26,31,110,${overlayOpacity - 0.05}) 100%)`,
        }}
      />
    </>
  )
}
