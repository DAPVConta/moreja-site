import Image from 'next/image'

interface HeroBackdropProps {
  bgImage?: string
  bgFocalX?: number
  bgFocalY?: number
  overlayOpacity?: number
}

/**
 * Camada de fundo do hero com parallax via CSS scroll-driven animations.
 *
 * Estratégia (Fase 3, Ação 1):
 * - Nenhum JS, nenhum scroll listener, nenhum requestAnimationFrame.
 * - @keyframes hero-parallax definido em globals.css move a imagem de
 *   translate3d(0,0,0) até translate3d(0,-12vh,0) enquanto a raiz rola
 *   de 0 a 50vh — o efeito some naturalmente quando o hero sai de cena.
 * - @supports guard: em Safari 15/Firefox ESR que não suportam scroll-driven,
 *   a imagem permanece estática (sem erro, sem fallback JS pesado).
 * - prefers-reduced-motion: o reset global animation-duration: 0.01ms !important
 *   em globals.css congela a keyframe — garantia coberta.
 * - Imagem ampliada em 110% (padding-bottom -bottom-[12vh]) para que o
 *   deslocamento máximo de 12vh nunca exponha espaço vazio atrás da imagem.
 */
export function HeroBackdrop({
  bgImage,
  bgFocalX = 50,
  bgFocalY = 50,
  // Overlay forte (0.6) garante contraste do título branco e dos links do
  // header transparente independente da imagem escolhida. A imagem por baixo
  // já está a 35% de opacity (esmaecida), e o overlay adiciona a camada
  // navy que dá legibilidade ao texto.
  overlayOpacity = 0.6,
}: HeroBackdropProps) {
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
      {/*
        Wrapper full-cover (inset-0) garantindo que a imagem cobre 100% da
        seção, sem tira de bg navy aparecendo nas bordas. Antes usava
        `inset-x-0 top-0 bottom-0` + `paddingBottom: 12vh` que criava
        layout-shift na borda direita em alguns viewports.
        O parallax shift de 12vh agora vive em scale via transform-origin
        bottom — mais robusto.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden"
      >
        <Image
          src={bgImage}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          // w-full h-full + object-cover ensures full-bleed coverage
          // independente do aspect-ratio da foto fonte.
          className="object-cover w-full h-full"
          style={{
            objectPosition: `${bgFocalX}% ${bgFocalY}%`,
            // Imagem esmaecida em 35% — sai de 100% de presença (que competia
            // com o título e a busca) para apenas 35%, deixando o gradient
            // navy de fundo dominar e o conteúdo ler com clareza.
            opacity: 0.35,
            // Pequena escala extra (105%) compensa o shift do parallax
            // sem precisar de paddingBottom que estava causando issue
            // de cobertura horizontal.
            transform: 'scale(1.05)',
            transformOrigin: 'center center',
            // CSS scroll-driven parallax — supported in Chrome 115+, Safari 18+.
            animationName: 'hero-parallax',
            animationDuration: '1s',
            animationTimingFunction: 'linear',
            animationFillMode: 'both',
            animationTimeline: 'scroll(root)' as string,
            animationRange: '0 50vh' as string,
            willChange: 'transform',
          }}
        />
      </div>

      {/* Gradient overlay — tints and darkens for text legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg,
            rgba(1,7,68,${overlayOpacity + 0.2}) 0%,
            rgba(1,7,68,${overlayOpacity}) 60%,
            rgba(26,31,110,${overlayOpacity - 0.05}) 100%)`,
        }}
      />
    </>
  )
}
