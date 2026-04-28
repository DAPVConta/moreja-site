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
  overlayOpacity = 0.55,
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
        Wrapper overflow-hidden garante que os 12vh extras de imagem não
        extravasam para fora do hero. A CSS custom property --parallax-range
        é usada inline para evitar strings de animation complexas no TSX.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 bottom-0 overflow-hidden"
        style={{
          // Extra height so the -12vh shift never reveals a gap at the bottom
          paddingBottom: '12vh',
        }}
      >
        <Image
          src={bgImage}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
          style={{
            objectPosition: `${bgFocalX}% ${bgFocalY}%`,
            // CSS scroll-driven parallax — supported in Chrome 115+, Safari 18+.
            // @supports guard: browsers that don't support animation-timeline
            // simply ignore these properties and render a static image.
            animationName: 'hero-parallax',
            animationDuration: '1s',               // irrelevant with scroll-driven; sets scale
            animationTimingFunction: 'linear',
            animationFillMode: 'both',
            // animationTimeline and animationRange are CSS scroll-driven API
            // (Chrome 115+, Safari 18+). TypeScript may or may not know these
            // depending on lib version — cast to avoid version-skew errors.
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
