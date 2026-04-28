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
  /** Darkness of the overlay over the image (0–1). Default 0.55 */
  overlayOpacity?: number
  /** Optional prop for future API-driven suggestions passthrough to HeroSearch */
  suggestions?: Parameters<typeof HeroSearch>[0]['suggestions']
}

export function HeroSection({
  title = 'Encontre o imóvel',
  highlight = 'dos seus sonhos',
  subtitle = 'A Morejá Imobiliária oferece os melhores imóveis residenciais e comerciais. Compre, alugue ou invista com segurança e qualidade.',
  bgImage,
  bgFocalX = 50,
  bgFocalY = 50,
  overlayOpacity = 0.55,
  suggestions,
}: HeroSectionProps = {}) {
  return (
    <section
      className="relative bg-[#010744] text-white overflow-hidden
                 min-h-[560px] sm:min-h-[640px] lg:min-h-[720px] flex items-center"
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
      <div className="relative container-page py-16 sm:py-20 md:py-28 w-full">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">

          {/* Eyebrow — AnimatedChip ghost variant (Ação 5, Fase 3).
              ghost variant é o correto sobre fundo navy escuro.
              pulse=true (default) — desabilitado automaticamente via
              prefers-reduced-motion em globals.css. */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <AnimatedChip variant="ghost" icon={Sparkles} pulse>
              Morejá Imobiliária
            </AnimatedChip>
          </div>

          <h1 className="heading-display-xl mb-5 sm:mb-7 max-w-5xl mx-auto">
            {title}
            {highlight && (
              <>
                {' '}
                <span className="text-[#f2d22e]">{highlight}</span>
              </>
            )}
          </h1>

          {subtitle && (
            <p className="lead text-gray-200 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>

        <HeroSearch suggestions={suggestions} />
      </div>
    </section>
  )
}
