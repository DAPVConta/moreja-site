import Link from 'next/link'
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
  { name: 'Recife',      slug: 'recife' },
  { name: 'Olinda',      slug: 'olinda' },
  { name: 'Jaboatão dos Guararapes', slug: 'jaboatao' },
  { name: 'Paulista',    slug: 'paulista' },
  { name: 'Caruaru',     slug: 'caruaru' },
  { name: 'Petrolina',   slug: 'petrolina' },
]

export function FeaturedCities({
  title = 'Onde atuamos',
  subtitle = 'Escolha sua cidade e encontre o imóvel ideal',
  cities = defaultCities,
}: FeaturedCitiesProps) {
  return (
    <section className="py-20 bg-[#ededd1]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/comprar?cidade=${city.slug}`}
              className="group relative overflow-hidden rounded-xl aspect-[3/4] block shadow-sm hover:shadow-xl transition-shadow bg-[#010744]"
            >
              <div
                className="absolute inset-0 flex items-center justify-center p-6 text-[#f2d22e] transition-transform duration-500 group-hover:scale-110"
                aria-hidden="true"
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#010744] via-[#010744]/60 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <div className="flex items-start gap-1 mb-0.5">
                  <MapPin size={14} className="text-[#f2d22e] shrink-0 mt-0.5" aria-hidden="true" />
                  <h3 className="text-sm font-bold leading-tight">{city.name}</h3>
                </div>
                {city.count && (
                  <p className="text-[11px] text-gray-200 pl-4">{city.count}</p>
                )}
                <span className="flex items-center gap-1 text-[11px] text-[#f2d22e] font-semibold mt-1 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver imóveis
                  <ArrowRight size={11} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
