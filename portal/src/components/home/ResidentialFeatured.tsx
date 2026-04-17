import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'
import { PropertyCard, PropertyCardSkeleton } from '@/components/properties/PropertyCard'
import type { Property } from '@/types/property'

interface ResidentialFeaturedProps {
  properties: Property[]
  loading?: boolean
  title?: string
  subtitle?: string
  hrefAll?: string
}

export function ResidentialFeatured({
  properties,
  loading = false,
  title = 'Residencial em destaque',
  subtitle = 'Apartamentos, casas e coberturas para sua família',
  hrefAll = '/comprar?tipo=Residencial',
}: ResidentialFeaturedProps) {
  const residentials = properties
    .filter((p) => {
      const t = (p.tipo ?? '').toLowerCase()
      return ['apartamento', 'casa', 'cobertura', 'studio', 'kitnet', 'residencial'].some((k) =>
        t.includes(k),
      )
    })
    .slice(0, 6)

  return (
    <section className="py-20 bg-[#fafbff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#010744] bg-[#f2d22e]/30 rounded-full px-3 py-1 mb-3">
              <Home size={14} aria-hidden="true" />
              Residencial
            </div>
            <h2 className="section-title">{title}</h2>
            <p className="section-subtitle mb-0">{subtitle}</p>
          </div>
          <Link
            href={hrefAll}
            className="flex items-center gap-2 text-[#010744] font-semibold hover:text-[#f2d22e] transition-colors group shrink-0"
          >
            Ver todos residenciais
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : residentials.map((p, i) => <PropertyCard key={p.id} property={p} priority={i < 3} />)}
        </div>

        {residentials.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Nenhum imóvel residencial em destaque.</p>
            <Link href={hrefAll} className="btn-primary mt-4 inline-block">
              Ver catálogo residencial
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
