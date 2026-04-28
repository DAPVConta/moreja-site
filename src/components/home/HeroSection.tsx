import { HeroSearch } from './HeroSearch'
import { HeroBackdrop } from './HeroBackdrop'

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
}

export function HeroSection({
  title = 'Encontre o imóvel',
  highlight = 'dos seus sonhos',
  subtitle = 'A Morejá Imobiliária oferece os melhores imóveis residenciais e comerciais. Compre, alugue ou invista com segurança e qualidade.',
  bgImage,
  bgFocalX = 50,
  bgFocalY = 50,
  overlayOpacity = 0.55,
}: HeroSectionProps = {}) {
  return (
    <section
      className="relative bg-[#010744] text-white overflow-hidden
                 min-h-[560px] sm:min-h-[640px] lg:min-h-[720px] flex items-center"
    >
      <HeroBackdrop
        bgImage={bgImage}
        bgFocalX={bgFocalX}
        bgFocalY={bgFocalY}
        overlayOpacity={overlayOpacity}
      />

      {/* Decorative blob — yellow soft glow no canto direito (premium feel sem ruído) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full
                   bg-[#f2d22e]/10 blur-3xl"
      />

      <div className="relative container-page py-16 sm:py-20 md:py-28 w-full">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          {/* Eyebrow — discreto antes do título */}
          <span className="inline-block text-xs sm:text-sm font-bold uppercase tracking-[0.2em]
                           text-[#f2d22e] mb-4 sm:mb-6">
            Morejá Imobiliária
          </span>

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

        <HeroSearch />
      </div>
    </section>
  )
}
