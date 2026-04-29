import Link from 'next/link'
import { ArrowRight, Building2 } from 'lucide-react'
import { PropertyCard, PropertyCardSkeleton } from '@/components/properties/PropertyCard'
import {
  AnimatedChip,
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
  const filtered = properties.filter((p) => {
    const t = (p.tipo ?? '').toLowerCase()
    const sub = (p.subtipo ?? '').toLowerCase()
    return (
      t.includes('comercial') ||
      sub.includes('sala') ||
      sub.includes('galpão') ||
      sub.includes('loja')
    )
  })

  if (!loading && filtered.length === 0) return null

  const commercials = filtered.slice(0, 5)
  const skeletonCount = 5

  return (
    // bg-mesh-navy: navy base + radial yellow/white hints from globals.css
    <section className="section bg-mesh-navy">
      <div className="container-page">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            {/* ghost variant: white ring + white/90 text — correct for navy bg */}
            <AnimatedChip
              variant="ghost"
              icon={Building2}
              pulse={false}
              className="mb-3"
            >
              Comercial
            </AnimatedChip>

            {/* Heading and subtitle in white over navy */}
            <h2 className="section-title text-white">{title}</h2>
            <p className="section-subtitle text-white/70 mb-0">{subtitle}</p>
          </div>

          <Link
            href={hrefAll}
            className="
              flex items-center gap-2
              text-white/80 font-semibold
              hover:text-[#f2d22e]
              transition-colors duration-150
              group shrink-0
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2
              focus-visible:ring-offset-[#010744]
              motion-reduce:transition-none
            "
          >
            Ver todos comerciais
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform duration-150 motion-reduce:transition-none"
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
                    
                    className="basis-[85%] sm:basis-1/2 lg:basis-1/5 pr-5 sm:pr-6 last:pr-0"
                  >
                    <PropertyCardSkeleton />
                  </CarouselItem>
                ))
              : commercials.map((p, i) => (
                  <CarouselItem
                    key={p.id}
                    
                    className="basis-[85%] sm:basis-1/2 lg:basis-1/5 pr-5 sm:pr-6 last:pr-0"
                  >
                    <PropertyCard property={p} priority={i < 3} />
                  </CarouselItem>
                ))}
          </CarouselViewport>

          {/* variant="white" sobre fundo navy: bolinhas brancas semitransparentes */}
          <div className="mt-5 flex items-center justify-between gap-4">
            <CarouselDots variant="white" />
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
