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

/** Imóveis residenciais de fallback — exibidos enquanto o banco estiver vazio. */
const FALLBACK_RESIDENTIAL: Property[] = [
  {
    id: 'res-1', codigo: 'MRJ-001', titulo: 'Apartamento em Boa Viagem',
    tipo: 'Apartamento', subtipo: 'Apartamento', finalidade: 'Venda',
    preco: 580000, bairro: 'Boa Viagem', cidade: 'Recife', estado: 'PE',
    area_total: 85, quartos: 3, suites: 1, banheiros: 2, vagas: 1,
    descricao: 'Apartamento bem localizado em Boa Viagem, a poucos metros da praia.',
    fotos: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'],
    destaque: true,
  },
  {
    id: 'res-2', codigo: 'MRJ-002', titulo: 'Casa em Casa Forte',
    tipo: 'Casa', subtipo: 'Casa', finalidade: 'Venda',
    preco: 920000, bairro: 'Casa Forte', cidade: 'Recife', estado: 'PE',
    area_total: 220, quartos: 4, suites: 2, banheiros: 3, vagas: 2,
    descricao: 'Casa espaçosa em condomínio fechado, bairro nobre de Casa Forte.',
    fotos: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80'],
    destaque: true,
  },
  {
    id: 'res-3', codigo: 'MRJ-003', titulo: 'Apartamento nas Graças',
    tipo: 'Apartamento', subtipo: 'Apartamento', finalidade: 'Venda',
    preco: 750000, bairro: 'Graças', cidade: 'Recife', estado: 'PE',
    area_total: 110, quartos: 3, suites: 1, banheiros: 2, vagas: 1,
    descricao: 'Apartamento reformado no bairro das Graças, próximo ao Parque Amorim.',
    fotos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
    destaque: true,
  },
  {
    id: 'res-4', codigo: 'MRJ-004', titulo: 'Cobertura no Pina',
    tipo: 'Cobertura', subtipo: 'Cobertura', finalidade: 'Venda',
    preco: 1200000, bairro: 'Pina', cidade: 'Recife', estado: 'PE',
    area_total: 180, quartos: 4, suites: 3, banheiros: 4, vagas: 2,
    descricao: 'Cobertura duplex com vista para o mar no Pina.',
    fotos: ['https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?auto=format&fit=crop&w=800&q=80'],
    destaque: true,
  },
]

export function ResidentialFeatured({
  properties,
  loading = false,
  title = 'Residencial em destaque',
  subtitle = 'Apartamentos, casas e coberturas para sua família',
  hrefAll = '/comprar?tipo=Residencial',
}: ResidentialFeaturedProps) {
  const filtered = properties.filter((p) => {
    const t = (p.tipo ?? '').toLowerCase()
    return ['apartamento', 'casa', 'cobertura', 'studio', 'kitnet', 'residencial'].some((k) =>
      t.includes(k),
    )
  })

  // Usar fallback quando banco estiver vazio
  const residentials = (filtered.length > 0 ? filtered : FALLBACK_RESIDENTIAL).slice(0, 6)

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
