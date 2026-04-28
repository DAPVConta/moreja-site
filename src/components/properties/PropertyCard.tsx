'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Bed, Bath, Car, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Property } from '@/types/property'
import { formatPrice, formatArea } from '@/lib/format'
import { SaveButton } from './SaveButton'
import { CompareToggle } from './CompareToggle'
import { Badge } from '@/components/ui/Badge'

interface PropertyCardProps {
  property: Property
  priority?: boolean
  /** Aspect ratio do thumb. mobile: 16:9 (mais cards no fold); desktop: mantém 4:3. */
  aspect?: 'card' | 'square'
  /** Threshold de preço (em R$) p/ aplicar badge "Morejá Premium".
   *  Configurável em site_config.premium_price_threshold. Default: 1.000.000 */
  premiumThreshold?: number
}

const PLACEHOLDER = 'https://placehold.co/600x400/ededd1/010744?text=Sem+Foto'

export function PropertyCard({
  property,
  priority = false,
  aspect = 'card',
  premiumThreshold = 1_000_000,
}: PropertyCardProps) {
  // Mostra até 5 fotos no slider (limita pra evitar requests desnecessários)
  const photos = (property.fotos.length > 0 ? property.fotos : [PLACEHOLDER]).slice(0, 5)
  const [photoIdx, setPhotoIdx] = useState(0)
  const hasMultiple = photos.length > 1

  function nextPhoto(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPhotoIdx((i) => (i + 1) % photos.length)
  }
  function prevPhoto(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)
  }

  // Heurística para badges promocionais (alimentado depois pela price_history table)
  const isLaunch = (property as Property & { lancamento?: boolean }).lancamento === true
  const priceDropped =
    (property as Property & { preco_anterior?: number }).preco_anterior &&
    (property as Property & { preco_anterior?: number }).preco_anterior! > property.preco
  // Auto-aplica badge "Morejá Premium" acima do threshold (só Venda — aluguel
  // tem preços de outra ordem)
  const isPremium =
    property.finalidade === 'Venda' &&
    property.preco >= premiumThreshold &&
    !isLaunch

  const aspectClass = aspect === 'square' ? 'aspect-square' : 'aspect-[16/9] sm:aspect-[4/3]'

  return (
    <article
      className="group relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300
                 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Save + Compare buttons — z-acima do Link, não disparam navegação */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
        <SaveButton propertyId={property.id} variant="icon" />
        <CompareToggle
          property={{
            id: property.id,
            titulo: property.titulo,
            preco: property.preco,
            finalidade: property.finalidade,
            tipo: property.tipo,
            bairro: property.bairro,
            cidade: property.cidade,
            area_total: property.area_total,
            quartos: property.quartos,
            banheiros: property.banheiros,
            vagas: property.vagas ?? 0,
            fotos: property.fotos,
            href: `/imovel/${property.id}`,
            preco_condominio: property.preco_condominio,
            preco_iptu: property.preco_iptu,
          }}
        />
      </div>

      <Link href={`/imovel/${property.id}`} className="block">
        {/* Image area com slider on hover (desktop) e swipe-friendly tap-areas (mobile) */}
        <div className={`relative ${aspectClass} overflow-hidden bg-gray-100`}>
          {photos.map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={property.titulo}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-opacity duration-500 ${
                i === photoIdx ? 'opacity-100' : 'opacity-0'
              } group-hover:scale-105`}
              priority={priority && i === 0}
            />
          ))}

          {/* Arrows — aparecem só no hover (desktop) ou em telas com mouse fine */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={prevPhoto}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm
                           text-[#010744] shadow-md flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744]"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={nextPhoto}
                aria-label="Próxima foto"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm
                           text-[#010744] shadow-md flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744]"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dots — sempre visíveis para indicar que tem mais fotos */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className={`block h-1.5 rounded-full transition-all duration-200 ${
                      i === photoIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badges canto superior esquerdo */}
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5 max-w-[calc(100%-5rem)]">
            <Badge variant="default">{property.tipo}</Badge>
            <Badge variant={property.finalidade === 'Venda' ? 'accent' : 'secondary'}>
              {property.finalidade}
            </Badge>
            {isLaunch && <Badge variant="launch">Lançamento</Badge>}
            {isPremium && <Badge variant="exclusive">Morejá Premium</Badge>}
          </div>

          {/* Badges promocionais canto inferior esquerdo */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
            {priceDropped && <Badge variant="priceDrop">Baixou de preço</Badge>}
            {property.destaque && !isLaunch && !priceDropped && (
              <Badge variant="exclusive">Destaque</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3
            className="mb-2 line-clamp-2 text-base font-semibold leading-snug text-[#010744]
                       transition-colors group-hover:underline group-hover:underline-offset-4 group-hover:decoration-[#f2d22e] group-hover:decoration-2"
          >
            {property.titulo}
          </h3>

          <div className="mb-3 flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin size={14} className="shrink-0 text-[#f2d22e]" />
            <span className="truncate">
              {property.bairro}, {property.cidade}
            </span>
          </div>

          {/* Price */}
          <p className="mb-4 text-xl font-bold text-[#010744]">
            {formatPrice(property.preco)}
            {property.finalidade === 'Locação' && (
              <span className="text-sm font-normal text-gray-400">/mês</span>
            )}
          </p>

          {/* Features */}
          <div className="flex items-center gap-4 border-t border-gray-100 pt-3 text-sm text-gray-500">
            {property.quartos > 0 && (
              <span className="flex items-center gap-1.5">
                <Bed size={15} className="text-[#010744]" aria-label="Quartos" />
                {property.quartos}
              </span>
            )}
            {property.banheiros > 0 && (
              <span className="flex items-center gap-1.5">
                <Bath size={15} className="text-[#010744]" aria-label="Banheiros" />
                {property.banheiros}
              </span>
            )}
            {property.vagas != null && property.vagas > 0 && (
              <span className="flex items-center gap-1.5">
                <Car size={15} className="text-[#010744]" aria-label="Vagas" />
                {property.vagas}
              </span>
            )}
            {property.area_total > 0 && (
              <span className="ml-auto flex items-center gap-1.5">
                <Maximize2 size={15} className="text-[#010744]" aria-label="Área" />
                {formatArea(property.area_total)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      <div className="skeleton aspect-[16/9] sm:aspect-[4/3]" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-6 w-1/3 rounded" />
        <div className="flex gap-4 border-t border-gray-100 pt-3">
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-16 rounded ml-auto" />
        </div>
      </div>
    </div>
  )
}
