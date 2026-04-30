import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import type { Property } from '@/types/property'
import { fetchProperties, fetchEmpreendimentos } from '@/lib/properties'
import { formatPrice } from '@/lib/format'
import { lookupBairroCoords, jitterCoords } from '@/lib/recife-geo'
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

// Recife metropolitan bbox — pega Recife, Olinda, Jaboatão dos Guararapes,
// Camaragibe, Paulista e parte do Cabo. O `maxBounds` do Leaflet trava o
// pan, então a área aqui define o que o usuário consegue ver.
const RECIFE_BOUNDS: [[number, number], [number, number]] = [
  [-8.32, -35.10], // SW
  [-7.82, -34.78], // NE
]
const RECIFE_CENTER: [number, number] = [-8.0476, -34.92]
const RECIFE_DEFAULT_ZOOM = 11
const RECIFE_MIN_ZOOM = 10
const RECIFE_MAX_ZOOM = 17

function withinRecife(lat: number, lng: number): boolean {
  const [[s, w], [n, e]] = RECIFE_BOUNDS
  return lat >= s && lat <= n && lng >= w && lng <= e
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
  } else {
    // Fallback: Supremo CRM frequentemente não retorna coords (especialmente
    // p/ empreendimentos). Geocodificamos por bairro com tabela offline +
    // jitter determinístico p/ não empilhar pins do mesmo bairro.
    const fromBairro = lookupBairroCoords(p.bairro, p.cidade)
    if (fromBairro) {
      const [jLat, jLng] = jitterCoords(fromBairro, p.id || `${p.bairro}-${p.titulo}`)
      lat = jLat
      lng = jLng
      approximate = true
    }
  }

  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!withinRecife(lat, lng)) return null

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
 * Seção "Onde estamos no Recife" — mapa interativo travado na região
 * metropolitana com pins distintos para imóveis (amarelo, ícone casa) e
 * empreendimentos (navy, ícone prédio).
 *
 * O mapa em si é client-side (Leaflet via CDN); este Server Component
 * apenas prepara os pontos a partir do Supremo proxy. Pontos sem
 * latitude/longitude no payload do CRM são ignorados — mostramos só o que
 * pode ser plotado de fato.
 */
export async function LocationsMap({
  title = 'Onde estamos no Recife',
  subtitle = 'Explore o mapa para descobrir imóveis e empreendimentos próximos a você. Cada pin é um endereço real do nosso portfólio.',
  cityLabel = 'Recife e Região Metropolitana',
  ctaHref = '/comprar?cidade=Recife',
  maxPointsEachSide = 60,
}: LocationsMapProps) {
  // Não filtramos por cidade no fetch — o bbox da RMR já corta tudo fora,
  // e empreendimentos costumam vir cadastrados em Paulista, Olinda ou
  // Jaboatão dos Guararapes (todos dentro do bbox). O filtro por cidade
  // estaria descartando pontos válidos da região.
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
            <p className="text-sm font-semibold uppercase tracking-wider text-[#010744]/70 mt-3">
              {cityLabel}
            </p>
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
            bounds={RECIFE_BOUNDS}
            center={RECIFE_CENTER}
            zoom={RECIFE_DEFAULT_ZOOM}
            minZoom={RECIFE_MIN_ZOOM}
            maxZoom={RECIFE_MAX_ZOOM}
          />
        )}
      </div>
    </section>
  )
}
