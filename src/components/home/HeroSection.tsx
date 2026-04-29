import { Sparkles } from 'lucide-react'
import { AnimatedChip } from '@/components/ui/AnimatedChip'
import { HeroSearch } from './HeroSearch'
import { HeroBackdrop } from './HeroBackdrop'

/**
 * Props contract — 100% retrocompatível com home_sections.config.hero_search
 * e com a chamada em src/app/page.tsx (ou similar).
 * Nenhum prop existente foi removido ou renomeado.
 */
interface HeroSectionProps {
  title?: string
  highlight?: string
  subtitle?: string
  bgImage?: string
  /** Focal X (0–100, % from left). Default 50 */
  bgFocalX?: number
  /** Focal Y (0–100, % from top). Default 50 */
  bgFocalY?: number
  /** Darkness of the overlay over the image (0–1). Default 0.2 — overlay
   *  leve, foto a ~80% de visibilidade. Admin pode ajustar via
   *  home_sections.config.hero_search.overlay_opacity. */
  overlayOpacity?: number
  /** Optional prop for future API-driven suggestions passthrough to HeroSearch */
  suggestions?: Parameters<typeof HeroSearch>[0]['suggestions']
}

// Imagem default do hero — quando home_sections.config.hero_search.bg_image
// está vazio.
const DEFAULT_HERO_BG =
  'https://images.unsplash.com/photo-1518883529677-4dcae62cf45e?auto=format&fit=crop&w=1920&q=80'

export function HeroSection({
  title = 'Encontre o imóvel',
  highlight = 'dos seus sonhos',
  subtitle = 'A Morejá Imobiliária oferece os melhores imóveis residenciais e comerciais. Compre, alugue ou invista com segurança e qualidade.',
  bgImage = DEFAULT_HERO_BG,
  bgFocalX = 50,
  bgFocalY = 50,
  overlayOpacity = 0.2,
  suggestions,
}: HeroSectionProps = {}) {
  return (
    // mt-[-5rem] (mobile) / mt-[-5rem] sm: / mt-[-9rem] lg: puxam o hero
    // para baixo do header sticky (que ocupa h-16 mobile / h-20 desktop +
    // h-9 top-bar lg). pt-* compensa para manter o conteúdo centralizado
    // visualmente. Resultado: header transparente fica SOBRE o hero navy
    // (logo/menu brancos sobre fundo escuro = legíveis), em vez de ficar
    // numa faixa branca acima.
    <section
      className="relative bg-[#010744] text-white overflow-hidden
                 -mt-16 sm:-mt-20 lg:-mt-[7.25rem]
                 pt-16 sm:pt-20 lg:pt-[7.25rem]
                 min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] flex items-center"
    >
      {/* ── Background image / gradient ───────────────────────────────── */}
      <HeroBackdrop
        bgImage={bgImage}
        bgFocalX={bgFocalX}
        bgFocalY={bgFocalY}
        overlayOpacity={overlayOpacity}
      />

      {/* ── Grain noise overlay (Ação 2, Fase 3) ─────────────────────────
          mix-blend-overlay at 6% opacity adds tactile depth without
          affecting text legibility. pointer-events-none + aria-hidden
          ensure zero impact on interaction or accessibility.
          bg-repeat: repeat tiles the 200×200 SVG seamlessly. ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "url('/grain.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* ── Soft yellow glow (top-right accent) ───────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full
                   bg-[#f2d22e]/10 blur-3xl"
      />

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="relative container-page py-10 sm:py-14 md:py-16 w-full">
        <div className="text-center mb-6 sm:mb-8">

          {/* Eyebrow — AnimatedChip ghost. */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <AnimatedChip variant="ghost" icon={Sparkles} pulse>
              Morejá Imobiliária
            </AnimatedChip>
          </div>

          {/* Título reduzido — text-3xl sm:text-4xl lg:text-5xl (era
              heading-display-xl que ia até ~6rem). Mantém peso editorial
              extrabold + tracking apertado mas ocupa menos altura vertical. */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-3 sm:mb-4 max-w-4xl mx-auto text-balance">
            {title}
            {highlight && (
              <>
                {' '}
                <span className="text-[#f2d22e]">{highlight}</span>
              </>
            )}
          </h1>

          {subtitle && (
            <p className="text-sm sm:text-base text-gray-200 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>

        <HeroSearch suggestions={suggestions} />
      </div>
    </section>
  )
}
