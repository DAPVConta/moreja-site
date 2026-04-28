import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight } from 'lucide-react'

interface City {
  name: string
  slug: string
  count?: string
  image?: string
}

interface FeaturedCitiesProps {
  title?: string
  subtitle?: string
  cities?: City[]
}

const defaultCities: City[] = [
  { name: 'Recife', slug: 'recife' },
  { name: 'Olinda', slug: 'olinda' },
  { name: 'Jaboatão dos Guararapes', slug: 'jaboatao' },
  { name: 'Paulista', slug: 'paulista' },
  { name: 'Caruaru', slug: 'caruaru' },
  { name: 'Petrolina', slug: 'petrolina' },
]

/**
 * Asymmetric grid pattern (Compass / Sotheby's style):
 *   • Desktop (lg+): 1 hero card 2x2 + 4 small cards (3 columns × 2 rows = 6 slots,
 *     hero ocupa 4 slots → mostra 5 cidades). Sexta cidade aparece em mobile/tablet.
 *   • Tablet (md): 3 colunas × 2 linhas
 *   • Mobile: snap-x carousel horizontal (Bloco 4)
 *
 * Quando a cidade tem `image`, usa next/image com mask SVG por baixo. Quando
 * não tem, cai no map SVG mask (comportamento atual).
 */
export function FeaturedCities({
  title = 'Onde atuamos',
  subtitle = 'Escolha sua cidade e encontre o imóvel ideal',
  cities = defaultCities,
}: FeaturedCitiesProps) {
  // Desktop: hero (idx 0) ocupa col-span-2 row-span-2 ; resto preenche 4 slots.
  const hero = cities[0]
  const rest = cities.slice(1, 5) // próximas 4
  const overflow = cities.slice(5) // mostradas só em md/sm
  void overflow

  return (
    <section className="section bg-[#ededd1]/40">
      <div className="container-page">
        <div className="mb-10 sm:mb-12 max-w-2xl">
          <h2 className="heading-h2 text-[#010744] mb-2">{title}</h2>
          <p className="lead">{subtitle}</p>
        </div>

        {/* Desktop: asymmetric grid 3 col × 2 row, hero 2×2 */}
        <div className="hidden lg:grid grid-cols-3 grid-rows-2 gap-4 h-[560px]">
          {hero && <CityCard city={hero} priority hero />}
          {rest.map((city) => (
            <CityCard key={city.slug} city={city} />
          ))}
        </div>

        {/* Tablet/Mobile: grid simples 2-3 cols com aspect ratio fixo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:hidden">
          {cities.map((city) => (
            <CityCard key={city.slug} city={city} small />
          ))}
        </div>
      </div>
    </section>
  )
}

interface CityCardProps {
  city: City
  priority?: boolean
  hero?: boolean
  small?: boolean
}

function CityCard({ city, priority = false, hero = false, small = false }: CityCardProps) {
  const sizeClasses = hero
    ? 'col-span-2 row-span-2 h-full'
    : small
      ? 'aspect-[3/4]'
      : 'h-full'

  return (
    <Link
      href={`/comprar?cidade=${city.slug}`}
      className={`group relative block overflow-hidden rounded-2xl bg-[#010744] shadow-md transition-all
                  hover:shadow-xl hover:-translate-y-0.5 ${sizeClasses}`}
      aria-label={`Ver imóveis em ${city.name}${city.count ? ` (${city.count})` : ''}`}
    >
      {/* Foto da cidade (se tiver) */}
      {city.image ? (
        <Image
          src={city.image}
          alt=""
          fill
          sizes={
            hero
              ? '(max-width: 1024px) 100vw, 66vw'
              : '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
          }
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          priority={priority}
        />
      ) : (
        // Fallback: SVG mask do mapa da cidade preenchido em amarelo
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
          style={{
            WebkitMaskImage: `url('/maps/${city.slug}.svg')`,
            maskImage: `url('/maps/${city.slug}.svg')`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            backgroundColor: '#f2d22e',
            opacity: 0.85,
          }}
        />
      )}

      {/* Gradient overlay para legibilidade do texto */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#010744] via-[#010744]/60 to-transparent"
      />

      <div className={`absolute inset-x-0 bottom-0 p-4 text-white ${hero ? 'sm:p-6' : ''}`}>
        <div className="flex items-start gap-1.5 mb-1">
          <MapPin
            size={hero ? 18 : 14}
            className="text-[#f2d22e] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <h3
            className={`font-bold leading-tight ${
              hero ? 'text-2xl sm:text-3xl' : 'text-sm sm:text-base'
            }`}
          >
            {city.name}
          </h3>
        </div>
        {city.count && (
          <p className={`pl-5 text-gray-200 ${hero ? 'text-sm' : 'text-[11px]'}`}>
            {city.count}
          </p>
        )}
        <span
          className={`mt-2 inline-flex items-center gap-1 pl-5 font-semibold text-[#f2d22e] transition-all
                      ${hero ? 'text-sm' : 'text-[11px]'}
                      group-hover:gap-2 lg:opacity-90`}
        >
          Ver imóveis
          <ArrowRight size={hero ? 16 : 12} aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
