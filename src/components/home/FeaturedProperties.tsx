import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
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

/** Imóveis de destaque de fallback — exibidos enquanto o banco estiver vazio. */
const FALLBACK_FEATURED: Property[] = [
  {
    id: 'feat-1', codigo: 'MRJ-F01', titulo: 'Apartamento de Alto Padrão — Boa Viagem',
    tipo: 'Apartamento', subtipo: 'Apartamento', finalidade: 'Venda',
    preco: 890000, bairro: 'Boa Viagem', cidade: 'Recife', estado: 'PE',
    area_total: 130, quartos: 4, suites: 2, banheiros: 3, vagas: 2,
    descricao: 'Apartamento de alto padrão a 200m da praia de Boa Viagem, varanda gourmet.',
    fotos: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'],
    destaque: true,
  },
  {
    id: 'feat-2', codigo: 'MRJ-F02', titulo: 'Casa com Piscina — Casa Forte',
    tipo: 'Casa', subtipo: 'Casa', finalidade: 'Venda',
    preco: 1350000, bairro: 'Casa Forte', cidade: 'Recife', estado: 'PE',
    area_total: 280, quartos: 4, suites: 3, banheiros: 4, vagas: 3,
    descricao: 'Casa com piscina, jardim e ampla área de lazer em condomínio fechado.',
    fotos: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'],
    destaque: true,
  },
  {
    id: 'feat-3', codigo: 'MRJ-F03', titulo: 'Penthouse nas Graças',
    tipo: 'Cobertura', subtipo: 'Cobertura', finalidade: 'Venda',
    preco: 2100000, bairro: 'Graças', cidade: 'Recife', estado: 'PE',
    area_total: 250, quartos: 4, suites: 4, banheiros: 5, vagas: 3,
    descricao: 'Penthouse exclusivo com terraço privativo e vista panorâmica de Recife.',
    fotos: ['https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?auto=format&fit=crop&w=800&q=80'],
    destaque: true,
  },
  {
    id: 'feat-4', codigo: 'MRJ-F04', titulo: 'Studio Moderno — Pina',
    tipo: 'Apartamento', subtipo: 'Studio', finalidade: 'Venda',
    preco: 380000, bairro: 'Pina', cidade: 'Recife', estado: 'PE',
    area_total: 42, quartos: 1, suites: 1, banheiros: 1, vagas: 1,
    descricao: 'Studio inteligente com acabamento premium próximo ao Cais do Pina.',
    fotos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
    destaque: true,
  },
  {
    id: 'feat-5', codigo: 'MRJ-F05', titulo: 'Apartamento na Zona Sul — Imbiribeira',
    tipo: 'Apartamento', subtipo: 'Apartamento', finalidade: 'Venda',
    preco: 490000, bairro: 'Imbiribeira', cidade: 'Recife', estado: 'PE',
    area_total: 90, quartos: 3, suites: 1, banheiros: 2, vagas: 1,
    descricao: 'Apartamento com três quartos, bem localizado na zona sul do Recife.',
    fotos: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'],
    destaque: true,
  },
  {
    id: 'feat-6', codigo: 'MRJ-F06', titulo: 'Casa em Olinda — Ampliada',
    tipo: 'Casa', subtipo: 'Casa', finalidade: 'Venda',
    preco: 650000, bairro: 'Carmo', cidade: 'Olinda', estado: 'PE',
    area_total: 200, quartos: 4, suites: 1, banheiros: 3, vagas: 2,
    descricao: 'Casa ampliada com quintal em rua tranquila de Olinda, próximo ao centro histórico.',
    fotos: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80'],
    destaque: true,
  },
]

export function FeaturedProperties({ properties, loading = false }: FeaturedPropertiesProps) {
  const skeletonCount = 6

  // Usar fallback quando banco estiver vazio
  const displayProperties = properties.length > 0 ? properties : FALLBACK_FEATURED

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
              : displayProperties.map((property, index) => (
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
