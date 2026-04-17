import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Bed, Bath, Car, Maximize2 } from 'lucide-react'
import type { Property } from '@/types/property'
import { formatPrice, formatArea } from '@/lib/properties'

interface PropertyCardProps {
  property: Property
  priority?: boolean
}

export function PropertyCard({ property, priority = false }: PropertyCardProps) {
  const mainPhoto = property.fotos[0] ?? 'https://placehold.co/600x400/ededd1/010744?text=Sem+Foto'

  return (
    <Link href={`/imovel/${property.id}`} className="property-card group block">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={mainPhoto}
          alt={property.titulo}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          priority={priority}
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-[#010744] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {property.tipo}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              property.finalidade === 'Venda'
                ? 'bg-[#f2d22e] text-[#010744]'
                : 'bg-white text-[#010744]'
            }`}
          >
            {property.finalidade}
          </span>
        </div>
        {property.destaque && (
          <div className="absolute top-3 right-3">
            <span className="bg-[#f2d22e] text-[#010744] text-xs font-bold px-2.5 py-1 rounded-full">
              Destaque
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[#010744] text-base leading-snug line-clamp-2 mb-2 group-hover:text-[#f2d22e] transition-colors">
          {property.titulo}
        </h3>

        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
          <MapPin size={14} className="shrink-0 text-[#f2d22e]" />
          <span className="truncate">
            {property.bairro}, {property.cidade}
          </span>
        </div>

        {/* Price */}
        <p className="text-xl font-bold text-[#010744] mb-4">
          {formatPrice(property.preco)}
          {property.finalidade === 'Locação' && (
            <span className="text-sm font-normal text-gray-400">/mês</span>
          )}
        </p>

        {/* Features */}
        <div className="flex items-center gap-4 text-gray-500 text-sm border-t border-gray-100 pt-3">
          {property.quartos > 0 && (
            <span className="flex items-center gap-1.5">
              <Bed size={15} className="text-[#010744]" />
              {property.quartos}
            </span>
          )}
          {property.banheiros > 0 && (
            <span className="flex items-center gap-1.5">
              <Bath size={15} className="text-[#010744]" />
              {property.banheiros}
            </span>
          )}
          {property.vagas != null && property.vagas > 0 && (
            <span className="flex items-center gap-1.5">
              <Car size={15} className="text-[#010744]" />
              {property.vagas}
            </span>
          )}
          {property.area_total > 0 && (
            <span className="flex items-center gap-1.5 ml-auto">
              <Maximize2 size={15} className="text-[#010744]" />
              {formatArea(property.area_total)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-md">
      <div className="skeleton aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-6 w-1/3 rounded" />
        <div className="flex gap-4 pt-3 border-t border-gray-100">
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-16 rounded ml-auto" />
        </div>
      </div>
    </div>
  )
}
