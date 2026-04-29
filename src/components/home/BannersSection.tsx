'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import type { Banner } from '@/types/site'

interface BannersSectionProps {
  banners: Banner[]
  autoplay?: boolean
  intervalSeconds?: number
}

/** Banners de fallback usados enquanto o banco estiver vazio. */
const FALLBACK_BANNERS: Banner[] = [
  {
    id: 'fallback-1',
    page: 'home',
    title: 'Realize o sonho da casa própria',
    subtitle: 'Mais de 15 anos conectando famílias aos melhores imóveis de Recife e região metropolitana.',
    cta_text: 'Conhecer imóveis',
    cta_link: '/comprar',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',
    mobile_image_url: null,
    position: 0,
    active: true,
    created_at: '',
  },
  {
    id: 'fallback-2',
    page: 'home',
    title: 'Quer vender mais rápido?',
    subtitle: 'Anuncie com a Morejá e alcance milhares de compradores qualificados em Recife.',
    cta_text: 'Anunciar imóvel',
    cta_link: '/contato',
    image_url: 'https://images.unsplash.com/photo-1494522358652-f30e61a60313?auto=format&fit=crop&w=1600&q=80',
    mobile_image_url: null,
    position: 1,
    active: true,
    created_at: '',
  },
]

export function BannersSection({
  banners: bannersProp,
  autoplay = true,
  // Default 4s — pedido do cliente. Configurável via
  // home_sections.config.banners.interval_seconds.
  intervalSeconds = 4,
}: BannersSectionProps) {
  // Usar fallback quando banco estiver vazio
  const banners = bannersProp.length > 0 ? bannersProp : FALLBACK_BANNERS

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const multi = banners.length > 1
  const intervalMs = Math.max(1, intervalSeconds) * 1000

  const go = (index: number) => {
    if (banners.length === 0) return
    setCurrent((index + banners.length) % banners.length)
  }

  // Autoplay com setInterval — mais robusto que setTimeout-encadeado.
  // Loop garantido via modulo. Pause em hover via state `paused` (controlado
  // por onMouseEnter/Leave) ou click no botão pause/play.
  useEffect(() => {
    if (!multi || !autoplay || paused) return
    const id = setInterval(() => {
      setCurrent((p) => (p + 1) % banners.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [multi, autoplay, paused, banners.length, intervalMs])

  // banners nunca é vazio aqui — já substituído por FALLBACK_BANNERS acima

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="container-page">
        <div
          className="relative w-full overflow-hidden rounded-2xl shadow-xl shadow-[#010744]/10
                     aspect-[3/2] md:aspect-[12/5]"
          // Pause apenas via botão explícito (pause/play), não no hover.
          // Cliente pediu loop contínuo — sair do hover não pode reiniciar
          // se o usuário tinha pausado manualmente, e parar no hover quebra
          // a percepção de que sempre roda.
          aria-roledescription="carousel"
          aria-label="Banners promocionais"
        >
          {banners.map((b, i) => {
            const isCurrent = i === current
            const hasMobile = !!b.mobile_image_url

            return (
              <div
                key={b.id}
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                  opacity: isCurrent ? 1 : 0,
                  pointerEvents: isCurrent ? 'auto' : 'none',
                }}
                aria-hidden={!isCurrent}
                role="group"
                aria-label={`Banner ${i + 1} de ${banners.length}`}
              >
                {/* Imagem mobile (se informada) */}
                {hasMobile && b.mobile_image_url && (
                  <Image
                    src={b.mobile_image_url}
                    alt={b.title ?? ''}
                    fill
                    sizes="100vw"
                    className="object-cover md:hidden"
                    priority={i === 0}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                  />
                )}
                {/* Imagem desktop (ou default) */}
                {b.image_url && (
                  <Image
                    src={b.image_url}
                    alt={b.title ?? ''}
                    fill
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    className={`object-cover ${hasMobile ? 'hidden md:block' : ''}`}
                    priority={i === 0}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                  />
                )}

                {/* Gradient overlay — content alinhado à esquerda quando há texto */}
                {(b.title || b.subtitle || b.cta_text) && (
                  <div
                    className="absolute inset-0 flex items-center
                               bg-gradient-to-r from-black/70 via-black/40 to-transparent
                               px-6 sm:px-10 lg:px-14"
                  >
                    <div className="text-white max-w-2xl lg:max-w-3xl">
                      {b.title && (
                        <h2
                          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold
                                     drop-shadow-lg mb-3 leading-tight tracking-tight"
                        >
                          {b.title}
                        </h2>
                      )}
                      {b.subtitle && (
                        <p className="text-sm sm:text-base md:text-lg text-gray-100 drop-shadow mb-6 max-w-xl">
                          {b.subtitle}
                        </p>
                      )}
                      {b.cta_text && b.cta_link && (
                        <Link
                          href={b.cta_link}
                          className="inline-flex items-center gap-2 min-h-[48px] rounded-xl bg-[#f2d22e] px-6
                                     font-bold text-[#010744] text-sm sm:text-base shadow-lg
                                     transition-all hover:brightness-105 hover:shadow-xl active:scale-[0.98]
                                     focus-visible:outline-none focus-visible:ring-2
                                     focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2
                                     focus-visible:ring-offset-black"
                        >
                          {b.cta_text}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {multi && (
            <>
              {/* Arrow buttons — 48x48, glassmorphism, sempre visíveis */}
              <button
                onClick={() => {
                  go(current - 1)
                }}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10
                           flex items-center justify-center h-12 w-12 rounded-full
                           bg-white/20 border border-white/30 backdrop-blur-md
                           text-white transition-all hover:bg-white/40 hover:scale-105
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
                           focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Banner anterior"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={() => {
                  go(current + 1)
                }}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10
                           flex items-center justify-center h-12 w-12 rounded-full
                           bg-white/20 border border-white/30 backdrop-blur-md
                           text-white transition-all hover:bg-white/40 hover:scale-105
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
                           focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Próximo banner"
              >
                <ChevronRight size={22} />
              </button>

              {/* Dots + pause button (WCAG 2.2.2) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
                <div className="flex gap-2">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        go(i)
                            }}
                      className={`h-2 rounded-full transition-all ${
                        i === current ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Ir para banner ${i + 1}`}
                      aria-current={i === current ? 'true' : undefined}
                    />
                  ))}
                </div>

                {autoplay && (
                  <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    aria-label={paused ? 'Retomar autoplay' : 'Pausar autoplay'}
                    className="ml-1 flex h-7 w-7 items-center justify-center rounded-full
                               bg-white/20 border border-white/30 backdrop-blur-md text-white
                               transition-colors hover:bg-white/40
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {paused ? <Play size={12} /> : <Pause size={12} />}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
