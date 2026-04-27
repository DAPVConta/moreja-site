import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PropertyCard, PropertyCardSkeleton } from '@/components/properties/PropertyCard'
import type { Property } from '@/types/property'

interface FeaturedPropertiesProps {
  properties: Property[]
  loading?: boolean
}

export function FeaturedProperties({ properties, loading = false }: FeaturedPropertiesProps) {
  return (
    <section className="section bg-white">
      <div className="container-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
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

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : properties.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  priority={index < 3}
                />
              ))}
        </div>

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
