'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play, ArrowRight } from 'lucide-react'
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

/**
 * BannersSection — carrossel editorial.
 *
 * Direção de design (redesign):
 *  • Imagem full-bleed com Ken Burns sutil no slide ativo (classe
 *    .banner-kenburns, ver globals.css) + crossfade de 700ms.
 *  • Scrim navy cinematográfico no rodapé (marca #010744) no lugar do
 *    antigo card branco — o texto vive sobre a imagem, em tipografia
 *    display branca, com entrada staggered (.banner-content-in).
 *  • Eyebrow com filete dourado + contador ("01 — 03"): funciona mesmo
 *    quando o admin só preencheu o título.
 *  • Controles consolidados no rodapé: barras de progresso segmentadas
 *    (estilo stories, sincronizadas com o autoplay) à esquerda e setas +
 *    pause à direita. Nada flutuando no meio da imagem.
 *  • Banner só-imagem (arte com texto baked-in, ex. MCMV): nenhum bloco
 *    de texto é renderizado e o scrim é mínimo, apenas para os controles.
 */
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
  const running = multi && autoplay && !paused

  const go = (index: number) => {
    if (banners.length === 0) return
    setCurrent((index + banners.length) % banners.length)
  }

  // Autoplay com setInterval. `current` nas deps: navegação manual reinicia
  // o ciclo, mantendo o intervalo cheio E em sincronia exata com a barra de
  // progresso (que também reinicia via key={current}).
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setCurrent((p) => (p + 1) % banners.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [running, banners.length, intervalMs, current])

  const total = String(banners.length).padStart(2, '0')

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="container-page">
        <div
          className="relative w-full overflow-hidden rounded-3xl bg-[#010744]
                     shadow-2xl shadow-[#010744]/15 ring-1 ring-[#010744]/10
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
            const hasContent = !!(b.title || b.subtitle || b.cta_text)

            return (
              <div
                key={b.id}
                className="absolute inset-0 transition-opacity duration-700 ease-out"
                style={{
                  opacity: isCurrent ? 1 : 0,
                  pointerEvents: isCurrent ? 'auto' : 'none',
                }}
                aria-hidden={!isCurrent}
                role="group"
                aria-label={`Banner ${i + 1} de ${banners.length}`}
              >
                {/* Wrapper do Ken Burns — a troca de classe quando o slide
                    ativa reinicia a animação; slides inativos ficam em
                    scale(1), invisíveis atrás do crossfade. */}
                <div className={`absolute inset-0 ${isCurrent ? 'banner-kenburns' : ''}`}>
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
                </div>

                {/* Scrim: cinematográfico quando há texto; mínimo (só p/ os
                    controles respirarem) quando a arte fala sozinha. */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-0 bottom-0 ${
                    hasContent
                      ? 'h-4/5 bg-gradient-to-t from-[#010744]/90 via-[#010744]/40 to-transparent'
                      : 'h-24 bg-gradient-to-t from-black/40 to-transparent'
                  }`}
                />

                {hasContent && isCurrent && (
                  <div
                    className="absolute inset-x-0 bottom-0 p-5 pb-16 sm:p-8 sm:pb-8 lg:p-10
                               flex flex-col items-start gap-2 sm:gap-3
                               sm:pr-40 lg:pr-48"
                  >
                    {/* Eyebrow: filete dourado + contador. Keyed por slide —
                        re-renderiza e re-anima a cada troca. */}
                    <div
                      className="banner-content-in flex items-center gap-3"
                      style={{ animationDelay: '80ms' }}
                    >
                      <span aria-hidden="true" className="h-px w-8 bg-[#f2d22e]" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f2d22e]">
                        {String(i + 1).padStart(2, '0')} — {total}
                      </span>
                    </div>

                    {b.title && (
                      <h2
                        className="banner-content-in max-w-2xl text-2xl sm:text-4xl lg:text-[2.75rem]
                                   font-bold leading-[1.08] tracking-tight text-white
                                   [text-wrap:balance] drop-shadow-sm"
                        style={{ animationDelay: '160ms' }}
                      >
                        {b.title}
                      </h2>
                    )}

                    {b.subtitle && (
                      <p
                        className="banner-content-in max-w-xl text-sm sm:text-base text-white/75
                                   leading-relaxed line-clamp-2"
                        style={{ animationDelay: '240ms' }}
                      >
                        {b.subtitle}
                      </p>
                    )}

                    {b.cta_text && b.cta_link && (
                      <Link
                        href={b.cta_link}
                        className="banner-content-in group/cta mt-1 sm:mt-2 inline-flex items-center gap-2
                                   rounded-full bg-[#f2d22e] px-5 py-2.5 sm:px-6 sm:py-3
                                   text-sm font-bold text-[#010744] shadow-lg shadow-black/20
                                   transition-all hover:brightness-105 hover:shadow-xl
                                   active:scale-[0.98]
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-white focus-visible:ring-offset-2
                                   focus-visible:ring-offset-[#010744]"
                        style={{ animationDelay: '320ms' }}
                      >
                        {b.cta_text}
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover/cta:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {multi && (
            <>
              {/* Barras de progresso segmentadas — canto inferior esquerdo.
                  O segmento ativo enche em sincronia com o autoplay (mesma
                  duration; ambos reiniciam quando `current` muda). */}
              <div
                className="absolute bottom-5 left-5 sm:left-8 lg:left-10 z-10 flex items-center gap-2"
                aria-label="Navegação dos banners"
              >
                {banners.map((_, i) => {
                  const isActive = i === current
                  // Estados do preenchimento dourado:
                  //  • ativo + autoplay  → anima scaleX 0→1 na duração do ciclo;
                  //    key com `current` reinicia a cada troca de slide; pausar
                  //    congela via animationPlayState (não pula para cheio).
                  //  • ativo sem autoplay → cheio, estático.
                  //  • inativo            → vazio.
                  const fillStyle: React.CSSProperties =
                    isActive && autoplay
                      ? {
                          animationDuration: `${intervalMs}ms`,
                          animationPlayState: running ? 'running' : 'paused',
                        }
                      : { transform: isActive ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left center' }
                  return (
                    <button
                      key={i}
                      onClick={() => go(i)}
                      aria-label={`Ir para banner ${i + 1}`}
                      aria-current={isActive ? 'true' : undefined}
                      className="group/seg relative h-6 w-8 sm:w-12 cursor-pointer"
                    >
                      {/* trilho */}
                      <span
                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full
                                   bg-white/30 transition-colors group-hover/seg:bg-white/50"
                      />
                      {/* preenchimento */}
                      <span
                        key={isActive ? `fill-${current}` : `idle-${i}`}
                        className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full
                                    bg-[#f2d22e] ${isActive && autoplay ? 'banner-progress' : ''}`}
                        style={fillStyle}
                      />
                    </button>
                  )
                })}
              </div>

              {/* Setas + pause — consolidados no canto inferior direito */}
              <div className="absolute bottom-4 right-4 sm:right-6 z-10 flex items-center gap-2">
                {autoplay && (
                  <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    aria-label={paused ? 'Retomar autoplay' : 'Pausar autoplay'}
                    className="flex h-9 w-9 items-center justify-center rounded-full
                               border border-white/25 bg-white/10 text-white backdrop-blur-md
                               transition-all hover:bg-white/25
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
                  </button>
                )}
                <button
                  onClick={() => go(current - 1)}
                  aria-label="Banner anterior"
                  className="flex h-11 w-11 items-center justify-center rounded-full
                             border border-white/25 bg-white/10 text-white backdrop-blur-md
                             transition-all hover:bg-[#f2d22e] hover:border-[#f2d22e] hover:text-[#010744]
                             active:scale-95
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button
                  onClick={() => go(current + 1)}
                  aria-label="Próximo banner"
                  className="flex h-11 w-11 items-center justify-center rounded-full
                             border border-white/25 bg-white/10 text-white backdrop-blur-md
                             transition-all hover:bg-[#f2d22e] hover:border-[#f2d22e] hover:text-[#010744]
                             active:scale-95
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
