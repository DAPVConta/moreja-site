import { ExternalLink } from 'lucide-react'

interface PropertyMapProps {
  /** Latitude. Quando ausente, cai no fallback de busca por endereço. */
  lat?: number
  /** Longitude. Quando ausente, cai no fallback de busca por endereço. */
  lng?: number
  /** Endereço completo (usado como fallback quando lat/lng não vierem). */
  address?: string
  /** Altura do mapa em px ou unidade Tailwind. Default 320px. */
  heightClassName?: string
}

/**
 * Mapa estático usando o embed gratuito do OpenStreetMap (sem libs,
 * sem API key, sem Mapbox/Google).
 *
 * Renderiza:
 * - Iframe com bbox de ~600m em torno do ponto
 * - Marcador (pin) na coordenada
 * - Link "Abrir no mapa" — Google Maps por endereço (Maps tem
 *   melhor cobertura para rotas no Brasil)
 *
 * Se nem lat/lng nem endereço chegarem, não renderiza nada.
 */
export function PropertyMap({
  lat,
  lng,
  address,
  heightClassName = 'h-[320px] sm:h-[380px]',
}: PropertyMapProps) {
  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)

  if (!hasCoords && !address) return null

  // Bounding box ~600m de raio (~0.005°) em torno da coordenada
  const delta = 0.005
  const bbox = hasCoords
    ? `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
    : null

  // Quando temos lat/lng usamos OSM (mais preciso, mostra o pin exato).
  // Quando só temos endereço, caímos no Google Maps embed por busca —
  // não precisa API key e o Google geocodifica automaticamente.
  const embedSrc = bbox
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
    : address
    ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
    : null

  // Link "Abrir no mapa" — preferimos endereço (Google Maps lida bem
  // com aproximação por nome do bairro quando coords não existem).
  const externalHref = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps?q=${encodeURIComponent(address ?? '')}`

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative ${heightClassName}`}>
      {embedSrc ? (
        <iframe
          src={embedSrc}
          title="Mapa do imóvel"
          className="w-full h-full block"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        // Sem coords e sem endereço: pin estático
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-sm gap-2 p-6 text-center">
          <span className="text-3xl">📍</span>
          <p>Mapa indisponível para este endereço.</p>
        </div>
      )}

      <a
        href={externalHref}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-[#010744] text-xs font-semibold px-3 py-1.5 rounded-full shadow-md hover:bg-white transition-colors"
      >
        Abrir no mapa
        <ExternalLink size={12} aria-hidden="true" />
      </a>
    </div>
  )
}
