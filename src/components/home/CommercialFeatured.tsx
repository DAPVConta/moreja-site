import Link from 'next/link'
import { ArrowRight, Building2 } from 'lucide-react'
import { PropertyCard, PropertyCardSkeleton } from '@/components/properties/PropertyCard'
import {
  Carousel,
  CarouselViewport,
  CarouselItem,
  CarouselPrev,
  CarouselNext,
  CarouselDotsEmbla as CarouselDots,
} from '@/components/ui'
import type { Property } from '@/types/property'

interface CommercialFeaturedProps {
  properties: Property[]
  loading?: boolean
  title?: string
  subtitle?: string
  hrefAll?: string
}

export function CommercialFeatured({
  properties,
  loading = false,
  title = 'Comercial em destaque',
  subtitle = 'Salas, lojas e galpões para o seu negócio',
  hrefAll = '/comprar?tipo=Comercial',
}: CommercialFeaturedProps) {
  const commercials = properties
    .filter((p) => {
      const t = (p.tipo ?? '').toLowerCase()
      const sub = (p.subtipo ?? '').toLowerCase()
      return (
        t.includes('comercial') ||
        sub.includes('sala') ||
        sub.includes('galpão') ||
        sub.includes('loja')
      )
    })
    .slice(0, 6)

  if (commercials.length === 0 && !loading) {
    return (
      <section className="section bg-white border-t border-gray-100">
        <div className="container-page text-center py-16 text-gray-400">
          <p className="text-lg">Nenhum imóvel comercial em destaque.</p>
          <Link href={hrefAll} className="btn-primary mt-4 inline-block">
            Ver catálogo comercial
          </Link>
        </div>
      </section>
    )
  }

  const skeletonCount = 6

  return (
    <section className="section bg-white border-t border-gray-100">
      <div className="container-page">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-white bg-[#010744] rounded-full px-3 py-1 mb-3">
              <Building2 size={14} aria-hidden="true" />
              Comercial
            </div>
            <h2 className="section-title">{title}</h2>
            <p className="section-subtitle mb-0">{subtitle}</p>
          </div>
          <Link
            href={hrefAll}
            className="flex items-center gap-2 text-[#010744] font-semibold hover:text-[#f2d22e]
                       transition-colors duration-150 group shrink-0"
          >
            Ver todos comerciais
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform duration-150"
              aria-hidden="true"
            />
          </Link>
        </div>

        <Carousel
          options={{ loop: false, align: 'start' }}
          ariaLabel="Imóveis comerciais em destaque"
          className="w-full"
        >
          <CarouselViewport className="-mx-4 sm:mx-0 px-4 sm:px-0">
            {loading
              ? Array.from({ length: skeletonCount }).map((_, i) => (
                  <CarouselItem
                    key={`skeleton-${i}`}
                    basis="85%"
                    className="sm:basis-1/2 lg:basis-1/3 pr-5 sm:pr-6 last:pr-0"
                  >
                    <PropertyCardSkeleton />
                  </CarouselItem>
                ))
              : commercials.map((p, i) => (
                  <CarouselItem
                    key={p.id}
                    basis="85%"
                    className="sm:basis-1/2 lg:basis-1/3 pr-5 sm:pr-6 last:pr-0"
                  >
                    <PropertyCard property={p} priority={i < 3} />
                  </CarouselItem>
                ))}
          </CarouselViewport>

          <div className="mt-5 flex items-center justify-between gap-4">
            <CarouselDots variant="navy" />
            <div className="hidden sm:flex items-center gap-2">
              <CarouselPrev size="sm" />
              <CarouselNext size="sm" />
            </div>
          </div>
        </Carousel>
      </div>
    </section>
  )
}
