import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import type { Property } from '@/types/property'
import { fetchProperties, fetchEmpreendimentos } from '@/lib/properties'
import { formatPrice } from '@/lib/format'
import { lookupBairroCoords, extractBairroFromText, jitterCoords } from '@/lib/recife-geo'
import { LocationsMapClient, type MapPoint } from './LocationsMapClient'

interface LocationsMapProps {
  title?: string
  subtitle?: string
  cityLabel?: string
  /** Link para "ver tudo no mapa" (lista filtrada por cidade). */
  ctaHref?: string
  /** Limite de pontos buscados de cada lado (imóvel/empreendimento). */
  maxPointsEachSide?: number
}

// O mapa não é mais travado numa região fixa: o enquadramento inicial é
// calculado a partir dos próprios pins (fitBounds) e o pan fica limitado
// apenas ao Brasil — a empresa pode atuar em qualquer cidade/região.
const BRAZIL_BOUNDS: [[number, number], [number, number]] = [
  [-34.5, -75.0], // SW
  [6.0, -32.0],   // NE
]
const BRAZIL_CENTER: [number, number] = [-14.235, -51.925]
const DEFAULT_ZOOM = 4
const MIN_ZOOM = 4
const MAX_ZOOM = 17

function withinBrazil(lat: number, lng: number): boolean {
  const [[s, w], [n, e]] = BRAZIL_BOUNDS
  return lat >= s && lat <= n && lng >= w && lng <= e
}

/** Bbox que enquadra todos os pins, com folga proporcional nas bordas. */
function computeFitBounds(points: MapPoint[]): [[number, number], [number, number]] | null {
  if (points.length === 0) return null
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lng < minLng) minLng = p.lng
    if (p.lng > maxLng) maxLng = p.lng
  }
  // Folga mínima de ~3km para 1 pin só não virar um zoom de rua.
  const padLat = Math.max((maxLat - minLat) * 0.15, 0.03)
  const padLng = Math.max((maxLng - minLng) * 0.15, 0.03)
  return [
    [minLat - padLat, minLng - padLng],
    [maxLat + padLat, maxLng + padLng],
  ]
}

function priceLabel(p: Property): string | undefined {
  if (!p.preco || p.preco <= 0) return undefined
  if (p.finalidade === 'Locação') {
    return `${formatPrice(p.preco)}/mês`
  }
  return formatPrice(p.preco)
}

function toMapPoint(
  p: Property,
  kind: MapPoint['kind'],
): MapPoint | null {
  let lat: number | undefined
  let lng: number | undefined
  let approximate = false

  if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
    lat = p.latitude
    lng = p.longitude
    // Coords geocodificadas na importação (centro do bairro) continuam
    // marcadas como aproximadas no popup.
    approximate = p.geo_aproximado === true
  } else {
    // Fallback 1: Supremo CRM frequentemente não retorna coords
    // (especialmente p/ empreendimentos). Geocodificamos por bairro com
    // tabela offline + jitter determinístico p/ não empilhar pins.
    // Fallback 2: quando o CRM nem `bairro`/`cidade` preenche (ex: imóveis
    // de teste com cadastro incompleto), tentamos extrair o nome de um
    // bairro conhecido do próprio título do imóvel.
    const fromBairro =
      lookupBairroCoords(p.bairro, p.cidade) ?? extractBairroFromText(p.titulo)
    if (fromBairro) {
      const [jLat, jLng] = jitterCoords(fromBairro, p.id || `${p.bairro}-${p.titulo}`)
      lat = jLat
      lng = jLng
      approximate = true
    }
  }

  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!withinBrazil(lat, lng)) return null

  return {
    id: p.id,
    kind,
    title: p.titulo,
    bairro: p.bairro,
    cidade: p.cidade,
    lat,
    lng,
    href: kind === 'empreendimento' ? `/empreendimentos/${p.id}` : `/imovel/${p.id}`,
    priceLabel: priceLabel(p),
    thumb: Array.isArray(p.fotos) ? p.fotos[0] : undefined,
    approximate,
  }
}

/**
 * Seção "Onde estão nossos imóveis" — mapa interativo com pins distintos
 * para imóveis (amarelo, ícone casa) e empreendimentos (navy, ícone prédio).
 * O enquadramento inicial se ajusta automaticamente aos pins existentes
 * (fitBounds), então funciona para qualquer cidade/região onde a
 * imobiliária atue.
 *
 * O mapa em si é client-side (Leaflet via CDN); este Server Component
 * apenas prepara os pontos a partir do portfólio importado. Pontos sem
 * latitude/longitude (nem bairro geocodificável) são ignorados — mostramos
 * só o que pode ser plotado de fato.
 */
export async function LocationsMap({
  title = 'Onde estão nossos imóveis',
  subtitle = 'Explore o mapa para descobrir imóveis e empreendimentos próximos a você. Cada pin é um endereço real do nosso portfólio.',
  cityLabel,
  ctaHref = '/comprar',
  maxPointsEachSide = 60,
}: LocationsMapProps) {
  // Sem filtro por cidade no fetch: o portfólio pode estar em qualquer
  // região e o enquadramento (fitBounds) se adapta ao que existir.
  const [imoveisRes, empreendsRes] = await Promise.all([
    fetchProperties({
      limit: maxPointsEachSide,
      order: 'data_desc',
    }).catch(() => ({ data: [] as Property[] })),
    fetchEmpreendimentos({
      limit: maxPointsEachSide,
      order: 'data_desc',
    }).catch(() => ({ data: [] as Property[] })),
  ])

  const imovelPoints = (imoveisRes.data ?? [])
    .map((p) => toMapPoint(p, 'imovel'))
    .filter((x): x is MapPoint => x !== null)

  const empPoints = (empreendsRes.data ?? [])
    .map((p) => toMapPoint(p, 'empreendimento'))
    .filter((x): x is MapPoint => x !== null)

  const points: MapPoint[] = [...imovelPoints, ...empPoints]

  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#010744] px-3 py-1
                             text-xs font-bold uppercase tracking-widest text-[#f2d22e] mb-3">
              <MapPin size={14} aria-hidden="true" />
              Mapa interativo
            </span>
            <h2 className="heading-h2 text-[#010744] mb-2">{title}</h2>
            <p className="lead text-gray-600">{subtitle}</p>
            {cityLabel && (
              <p className="text-sm font-semibold uppercase tracking-wider text-[#010744]/70 mt-3">
                {cityLabel}
              </p>
            )}
          </div>

          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-lg bg-[#010744] text-[#f2d22e]
                       font-semibold px-4 py-2.5 hover:bg-[#1a1f6e] transition-colors group self-start"
          >
            Ver lista completa
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        {points.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#010744]/20 bg-[#fafbff] p-12 text-center">
            <MapPin className="w-10 h-10 text-[#010744]/40 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-600">
              Nenhum imóvel ou empreendimento com endereço georreferenciado no momento.
            </p>
            <Link
              href={ctaHref}
              className="inline-block mt-4 text-sm font-semibold text-[#010744] underline"
            >
              Ver listagem completa
            </Link>
          </div>
        ) : (
          <LocationsMapClient
            points={points}
            bounds={BRAZIL_BOUNDS}
            fitBounds={computeFitBounds(points)}
            center={BRAZIL_CENTER}
            zoom={DEFAULT_ZOOM}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
          />
        )}
      </div>
    </section>
  )
}
