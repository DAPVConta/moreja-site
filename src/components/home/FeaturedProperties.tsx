import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PropertyCard, PropertyCardSkeleton } from '@/components/properties/PropertyCard'
import { CarouselDots } from '@/components/ui/CarouselDots'
import type { Property } from '@/types/property'

interface FeaturedPropertiesProps {
  properties: Property[]
  loading?: boolean
}

export function FeaturedProperties({ properties, loading = false }: FeaturedPropertiesProps) {
  const items = loading
    ? Array.from({ length: 6 }).map((_, i) => (
        <div key={`s-${i}`} className="snap-center shrink-0 sm:shrink w-[85%] sm:w-auto">
          <PropertyCardSkeleton />
        </div>
      ))
    : properties.map((property, index) => (
        <div key={property.id} className="snap-center shrink-0 sm:shrink w-[85%] sm:w-auto">
          <PropertyCard property={property} priority={index < 3} />
        </div>
      ))

  return (
    <section className="section bg-white">
      <div className="container-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="section-title">Imóveis em Destaque</h2>
            <p className="section-subtitle mb-0">
              Selecionamos os melhores imóveis para você
            </p>
          </div>
          <Link
            href="/comprar"
            className="flex items-center gap-2 text-[#010744] font-semibold hover:text-[#f2d22e] transition-colors group shrink-0"
          >
            Ver todos
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>

        {/* Carrossel snap-x em < sm com dots; grid 2 cols em sm+; 3 cols em lg+.
            -mx + px restaura a sangria nas bordas para o swipe casar
            com o container-page sem cortar o card central. */}
        <CarouselDots
          ariaLabel="Imóveis em destaque"
          className="
            -mx-4 sm:mx-0 px-4 sm:px-0
            flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6
            overflow-x-auto sm:overflow-visible
            snap-x snap-mandatory sm:snap-none
            scroll-smooth scrollbar-thin scroll-pl-4 sm:scroll-pl-0
            pb-4 sm:pb-0
          "
        >
          {items}
        </CarouselDots>

        {properties.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Nenhum imóvel em destaque no momento.</p>
            <Link href="/comprar" className="btn-primary mt-4 inline-block">
              Ver todos os imóveis
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
