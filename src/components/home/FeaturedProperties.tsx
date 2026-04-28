import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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

interface FeaturedPropertiesProps {
  properties: Property[]
  loading?: boolean
}

export function FeaturedProperties({ properties, loading = false }: FeaturedPropertiesProps) {
  const skeletonCount = 6
  const items = loading ? skeletonCount : properties.length

  if (items === 0 && !loading) {
    return (
      <section className="section bg-white">
        <div className="container-page text-center py-16 text-gray-400">
          <p className="text-lg">Nenhum imóvel em destaque no momento.</p>
          <Link href="/comprar" className="btn-primary mt-4 inline-block">
            Ver todos os imóveis
          </Link>
        </div>
      </section>
    )
  }

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
            className="flex items-center gap-2 text-[#010744] font-semibold hover:text-[#f2d22e]
                       transition-colors duration-150 group shrink-0"
          >
            Ver todos
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform duration-150"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/*
          Mobile (< sm):  single slide, peek next card at ~85% width
          Tablet (sm–lg): 2 cards side by side
          Desktop (lg+):  3 cards side by side

          CarouselViewport renders its own inner flex container, so CarouselItems
          are its direct children. The gap is applied to each item via padding-right
          (pr-5 / pr-6) rather than a wrapper gap to stay Embla-compatible.
        */}
        <Carousel
          options={{ loop: false, align: 'start' }}
          ariaLabel="Imóveis em destaque"
          className="w-full"
        >
          {/* -mx / px restores bleed so the peek effect extends to the screen edge
              on mobile without bleeding the container on desktop. */}
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
              : properties.map((property, index) => (
                  <CarouselItem
                    key={property.id}
                    basis="85%"
                    className="sm:basis-1/2 lg:basis-1/3 pr-5 sm:pr-6 last:pr-0"
                  >
                    <PropertyCard property={property} priority={index < 3} />
                  </CarouselItem>
                ))}
          </CarouselViewport>

          {/* Controls row — dots always visible, arrows visible on sm+ */}
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
