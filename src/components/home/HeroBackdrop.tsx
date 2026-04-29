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
  // Default 70% navy uniform overlay (camada navy a 70% de opacidade,
  // 30% de transparência). Imagem segue em 100% mas é fortemente coberta
  // pelo navy, deixando o título e busca dominantes. Pedido explícito
  // do cliente: "imagem fixa azul cor do sistema com transparência 70%".
  overlayOpacity = 0.7,
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
          className="object-cover w-full h-full"
          style={{
            objectPosition: `${bgFocalX}% ${bgFocalY}%`,
            // Imagem em 100% de opacity — antes ia a 35% (dimming primário)
            // mas combinado com overlay forte ficava escuro demais, escondendo
            // a foto. Agora a imagem aparece em sua intensidade natural; o
            // dimming de legibilidade vem 100% do overlay (40% por padrão).
            transform: 'scale(1.05)',
            transformOrigin: 'center center',
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

      {/* Overlay UNIFORME — 70% navy (cor do sistema #010744, alpha 0.7).
          Camada fixa navy em 70% de opacidade (= 30% de transparência) sobre
          a imagem. Pedido explícito do cliente para garantir visibilidade do
          overlay e domínio do texto branco/amarelo sobre a foto.
          Defensive fallback: valor inválido/<=0 do banco vira 0.7. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(1, 7, 68, ${
            typeof overlayOpacity === 'number' && overlayOpacity > 0
              ? overlayOpacity
              : 0.7
          })`,
        }}
      />
    </>
  )
}
