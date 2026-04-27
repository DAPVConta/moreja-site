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
    <section className="relative bg-[#010744] text-white overflow-hidden">
      <HeroBackdrop
        bgImage={bgImage}
        bgFocalX={bgFocalX}
        bgFocalY={bgFocalY}
        overlayOpacity={overlayOpacity}
      />

      <div className="relative container-page py-14 sm:py-20 md:py-28 lg:py-32">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="heading-h1 mb-4 sm:mb-6">
            {title}{' '}
            {highlight && <span className="text-[#f2d22e]">{highlight}</span>}
          </h1>
          {subtitle && (
            <p className="lead text-gray-200 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
        <HeroSearch />
      </div>
    </section>
  )
}
