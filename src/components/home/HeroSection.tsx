import { HeroSearch } from './HeroSearch'

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
  const hasImage = !!bgImage

  return (
    <section className="relative bg-[#010744] text-white overflow-hidden">
      {hasImage ? (
        <>
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: `url('${bgImage}')`,
              backgroundPosition: `${bgFocalX}% ${bgFocalY}%`,
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(1,7,68,${overlayOpacity + 0.2}) 0%, rgba(1,7,68,${overlayOpacity}) 60%, rgba(26,31,110,${overlayOpacity - 0.05}) 100%)`,
            }}
            aria-hidden="true"
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#010744] via-[#010744] to-[#1a1f6e]"
          aria-hidden="true"
        />
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-28">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 sm:mb-6">
            {title}{' '}
            {highlight && <span className="text-[#f2d22e]">{highlight}</span>}
          </h1>
          {subtitle && (
            <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
        <HeroSearch />
      </div>
    </section>
  )
}
