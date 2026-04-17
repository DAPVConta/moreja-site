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
  { name: 'São Paulo',    slug: 'sao-paulo',    count: '1.200+ imóveis', image: 'https://images.unsplash.com/photo-1543059080-f9b1272213d5?w=800&q=80' },
  { name: 'Guarulhos',    slug: 'guarulhos',    count: '350+ imóveis',   image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80' },
  { name: 'Santo André',  slug: 'santo-andre',  count: '280+ imóveis',   image: 'https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?w=800&q=80' },
  { name: 'São Bernardo', slug: 'sao-bernardo', count: '210+ imóveis',   image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80' },
  { name: 'Osasco',       slug: 'osasco',       count: '180+ imóveis',   image: 'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=800&q=80' },
  { name: 'Diadema',      slug: 'diadema',      count: '120+ imóveis',   image: 'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800&q=80' },
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
              className="group relative overflow-hidden rounded-xl aspect-[3/4] block shadow-sm hover:shadow-xl transition-shadow"
            >
              {city.image && (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${city.image}')` }}
                  aria-hidden="true"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#010744] via-[#010744]/40 to-transparent" />

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
