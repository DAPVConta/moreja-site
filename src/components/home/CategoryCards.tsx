import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export interface CategoryCard {
  title: string
  description: string
  href: string
  bg: string
}

interface CategoryCardsProps {
  title?: string
  subtitle?: string
  cards?: CategoryCard[]
}

const defaultCards: CategoryCard[] = [
  {
    title: 'Residencial',
    description: 'Apartamentos, casas e condomínios para sua família',
    href: '/comprar?tipo=Apartamento',
    bg: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  },
  {
    title: 'Comercial',
    description: 'Salas, galpões e espaços para o seu negócio crescer',
    href: '/comprar?tipo=Comercial',
    bg: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  },
  {
    title: 'Empreendimentos',
    description: 'Lançamentos exclusivos e novos empreendimentos',
    href: '/empreendimentos',
    bg: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
  },
]

export function CategoryCards({
  title = 'O que você procura?',
  subtitle = 'Encontre o imóvel ideal para cada momento da sua vida',
  cards,
}: CategoryCardsProps = {}) {
  const categories = cards && cards.length > 0 ? cards : defaultCards

  // Tailwind JIT só reconhece class names literais; mapeamos manualmente.
  const cols = Math.min(categories.length, 3)
  const gridCols =
    cols === 1 ? 'grid-cols-1' : cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'

  return (
    <section className="py-14 sm:py-20 bg-[#ededd1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>

        <div className={`grid grid-cols-1 ${gridCols} gap-5 sm:gap-6`}>
          {categories.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group relative overflow-hidden rounded-2xl aspect-[4/5] md:aspect-[3/4] block"
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${cat.bg}')` }}
                aria-hidden="true"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#010744]/90 via-[#010744]/40 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">{cat.title}</h3>
                <p className="text-sm text-gray-200 mb-3 sm:mb-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  {cat.description}
                </p>
                <span className="inline-flex items-center gap-2 text-[#f2d22e] font-semibold text-sm">
                  Ver imóveis
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
