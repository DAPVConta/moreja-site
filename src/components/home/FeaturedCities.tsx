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
 * Grid uniforme e compacto. Todas as cidades viram cards pequenos do mesmo
 * tamanho — antes havia um hero 2×2 que ocupava bastante espaço vertical
 * desnecessariamente para uma seção que é só "navegação por cidade".
 *
 * Quando a cidade tem `image`, usa next/image com mask SVG por baixo.
 * Quando não tem, cai no map SVG mask (comportamento atual).
 */
export function FeaturedCities({
  title = 'Onde atuamos',
  subtitle = 'Escolha sua cidade e encontre o imóvel ideal',
  cities = defaultCities,
}: FeaturedCitiesProps) {
  return (
    <section className="bg-[#ededd1]/40 py-10 sm:py-12">
      <div className="container-page">
        <div className="mb-6 sm:mb-8 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#010744] mb-1">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">{subtitle}</p>
        </div>

        <div
          className="grid gap-3 sm:gap-4
                     grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {cities.map((city, i) => (
            <CityCard key={city.slug} city={city} priority={i < 3} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface CityCardProps {
  city: City
  priority?: boolean
}

function CityCard({ city, priority = false }: CityCardProps) {
  return (
    <Link
      href={`/comprar?cidade=${city.slug}`}
      className="group relative block overflow-hidden rounded-xl bg-[#010744] shadow-sm transition-all
                 hover:shadow-md hover:-translate-y-0.5 aspect-[4/5]"
      aria-label={`Ver imóveis em ${city.name}${city.count ? ` (${city.count})` : ''}`}
    >
      {city.image ? (
        <Image
          src={city.image}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
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

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#010744] via-[#010744]/60 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
        <div className="flex items-start gap-1 mb-0.5">
          <MapPin
            size={12}
            className="text-[#f2d22e] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <h3 className="font-bold leading-tight text-xs sm:text-sm line-clamp-2">
            {city.name}
          </h3>
        </div>
        {city.count && (
          <p className="pl-4 text-[10px] text-gray-200">{city.count}</p>
        )}
        <span
          className="mt-1 inline-flex items-center gap-0.5 pl-4 text-[10px] font-semibold
                     text-[#f2d22e] transition-all group-hover:gap-1"
        >
          Ver imóveis
          <ArrowRight size={10} aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
