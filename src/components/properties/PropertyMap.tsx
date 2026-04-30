import { ExternalLink } from 'lucide-react'
import { lookupBairroCoords } from '@/lib/recife-geo'

interface PropertyMapProps {
  /** Latitude. Quando ausente, tenta cair no fallback bairro→coords. */
  lat?: number
  /** Longitude. Quando ausente, tenta cair no fallback bairro→coords. */
  lng?: number
  /** Endereço completo (usado em "Abrir no mapa" e no fallback textual). */
  address?: string
  /** Bairro — usado para coords aproximadas quando lat/lng não vierem. */
  bairro?: string
  /** Cidade — usada junto com `bairro` no lookup do `recife-geo`. */
  cidade?: string
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
  bairro,
  cidade,
  heightClassName = 'h-[320px] sm:h-[380px]',
}: PropertyMapProps) {
  const hasRealCoords =
    typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)

  // Fallback: o Supremo CRM raramente retorna lat/lng. Quando não vier,
  // usa o centro aproximado do bairro (mesma tabela usada no mapa da home).
  const fallbackCoords = !hasRealCoords ? lookupBairroCoords(bairro, cidade) : null
  const effectiveLat = hasRealCoords ? lat! : fallbackCoords?.[0]
  const effectiveLng = hasRealCoords ? lng! : fallbackCoords?.[1]
  const hasCoords =
    typeof effectiveLat === 'number' && typeof effectiveLng === 'number'
  const isApproximate = !hasRealCoords && hasCoords

  if (!hasCoords && !address) return null

  // Bounding box ~600m de raio (~0.005°) em torno da coordenada
  const delta = 0.005
  const bbox = hasCoords
    ? `${effectiveLng! - delta},${effectiveLat! - delta},${effectiveLng! + delta},${effectiveLat! + delta}`
    : null

  const embedSrc = bbox
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${effectiveLat},${effectiveLng}`
    : null

  // Link "Abrir no mapa" — preferimos endereço quando temos (Google Maps
  // resolve o número exato), e só caímos pra coords aproximadas se nem
  // endereço veio.
  const externalHref = address
    ? `https://www.google.com/maps?q=${encodeURIComponent(address)}`
    : `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}`

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
        // Sem coords nem bairro mapeado: mostra pin estático
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-sm gap-2 p-6 text-center">
          <span className="text-3xl">📍</span>
          <p>Mapa indisponível para este endereço.</p>
          {address && <p className="text-gray-400 text-xs">{address}</p>}
        </div>
      )}

      {isApproximate && (
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#010744] text-[11px] font-medium px-2.5 py-1 rounded-full shadow-md">
          Localização aproximada (centro do bairro)
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
