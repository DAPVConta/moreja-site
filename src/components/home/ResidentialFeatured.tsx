import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'
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

  if (residentials.length === 0 && !loading) {
    return (
      <section className="section bg-[#fafbff]">
        <div className="container-page text-center py-16 text-gray-400">
          <p className="text-lg">Nenhum imóvel residencial em destaque.</p>
          <Link href={hrefAll} className="btn-primary mt-4 inline-block">
            Ver catálogo residencial
          </Link>
        </div>
      </section>
    )
  }

  const skeletonCount = 6

  return (
    <section className="section bg-[#fafbff]">
      <div className="container-page">
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
            className="flex items-center gap-2 text-[#010744] font-semibold hover:text-[#f2d22e]
                       transition-colors duration-150 group shrink-0"
          >
            Ver todos residenciais
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform duration-150"
              aria-hidden="true"
            />
          </Link>
        </div>

        <Carousel
          options={{ loop: false, align: 'start' }}
          ariaLabel="Imóveis residenciais em destaque"
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
              : residentials.map((p, i) => (
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
