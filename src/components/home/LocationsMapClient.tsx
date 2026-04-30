'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MapPin, Building2, Home as HomeIcon } from 'lucide-react'

export interface MapPoint {
  id: string
  kind: 'imovel' | 'empreendimento'
  title: string
  bairro?: string
  cidade?: string
  lat: number
  lng: number
  href: string
  /** Preço formatado (já em string pronta), apenas exibição. */
  priceLabel?: string
  thumb?: string
  /** True quando coords vêm de geocoding por bairro (Supremo não tinha). */
  approximate?: boolean
}

interface LocationsMapClientProps {
  points: MapPoint[]
  /** Bounding box em [southWest, northEast] — bloqueia o pan fora da área. */
  bounds: [[number, number], [number, number]]
  /** Centro inicial. */
  center: [number, number]
  zoom: number
  minZoom: number
  maxZoom: number
}

// Leaflet via CDN — evita adicionar dependência ao package.json e segue o
// mesmo padrão de lazy-load script já usado em TurnstileWidget.
const LEAFLET_VERSION = '1.9.4'
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`

// Tipos mínimos do Leaflet que usamos. Carregamos a lib via CDN (sem
// `npm i leaflet`), por isso não importamos `@types/leaflet` — a tipagem
// abaixo cobre só a API que tocamos. Se um dia adicionarmos como dep,
// trocamos por `typeof import('leaflet')`.
interface LeafletLatLng {
  lat: number
  lng: number
}
interface LeafletLatLngBounds {
  contains(latlng: [number, number] | LeafletLatLng): boolean
}
interface LeafletMap {
  remove(): void
}
interface LeafletDivIcon {
  options: { html?: string }
}
interface LeafletMarker {
  addTo(map: LeafletMap): LeafletMarker
  bindPopup(html: string, options?: { maxWidth?: number }): LeafletMarker
}
interface LeafletTileLayer {
  addTo(map: LeafletMap): LeafletTileLayer
}
interface LeafletStatic {
  map(
    el: HTMLElement,
    opts: {
      center: [number, number]
      zoom: number
      minZoom?: number
      maxZoom?: number
      maxBounds?: LeafletLatLngBounds
      maxBoundsViscosity?: number
      scrollWheelZoom?: boolean
      zoomControl?: boolean
      attributionControl?: boolean
    },
  ): LeafletMap
  tileLayer(
    url: string,
    opts: { attribution?: string; maxZoom?: number; minZoom?: number },
  ): LeafletTileLayer
  marker(latlng: [number, number], opts: { icon: LeafletDivIcon }): LeafletMarker
  divIcon(opts: {
    className?: string
    html?: string
    iconSize?: [number, number]
    iconAnchor?: [number, number]
    popupAnchor?: [number, number]
  }): LeafletDivIcon
  latLng(lat: number, lng: number): LeafletLatLng
  latLngBounds(sw: LeafletLatLng, ne: LeafletLatLng): LeafletLatLngBounds
}

declare global {
  interface Window {
    L?: LeafletStatic
  }
}

function ensureLeafletLoaded(): Promise<LeafletStatic> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('window unavailable'))
      return
    }
    if (window.L) {
      resolve(window.L)
      return
    }

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = LEAFLET_CSS
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${LEAFLET_JS}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.L) resolve(window.L)
        else reject(new Error('Leaflet failed to attach to window'))
      })
      existing.addEventListener('error', () => reject(new Error('Leaflet load error')))
      return
    }

    const s = document.createElement('script')
    s.src = LEAFLET_JS
    s.async = true
    s.defer = true
    s.crossOrigin = ''
    s.onload = () => {
      if (window.L) resolve(window.L)
      else reject(new Error('Leaflet failed to attach to window'))
    }
    s.onerror = () => reject(new Error('Leaflet load error'))
    document.head.appendChild(s)
  })
}

function buildPinHtml(kind: MapPoint['kind']): string {
  // Imóvel: pin amarelo (cor da marca) com casa.
  // Empreendimento: pin navy (cor da marca) com prédio.
  const isEmp = kind === 'empreendimento'
  const fill = isEmp ? '#010744' : '#f2d22e'
  const stroke = isEmp ? '#f2d22e' : '#010744'
  const iconColor = isEmp ? '#f2d22e' : '#010744'
  const icon = isEmp
    // building icon (lucide Building2)
    ? '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>'
    // home icon (lucide Home)
    : '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'

  return `
    <div class="moreja-map-pin" data-kind="${kind}">
      <svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18 0C8.1 0 0 8 0 17.8c0 13.2 16.2 27 16.9 27.6a1.7 1.7 0 0 0 2.2 0C19.8 44.8 36 31 36 17.8 36 8 27.9 0 18 0Z"
              fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="18" cy="17.5" r="9.5" fill="${stroke}"/>
        <g transform="translate(10 9.5) scale(0.67)" fill="none" stroke="${iconColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          ${icon}
        </g>
      </svg>
    </div>
  `
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildPopupHtml(p: MapPoint): string {
  const tag =
    p.kind === 'empreendimento' ? 'Empreendimento' : 'Imóvel'
  const tagBg = p.kind === 'empreendimento' ? '#010744' : '#f2d22e'
  const tagFg = p.kind === 'empreendimento' ? '#f2d22e' : '#010744'
  const local = [p.bairro, p.cidade].filter(Boolean).join(', ')
  const approxNote = p.approximate
    ? `<div style="font-size:10px;color:#777;margin-top:2px;font-style:italic">Localização aproximada (centro do bairro)</div>`
    : ''
  const thumb = p.thumb
    ? `<img src="${escapeHtml(p.thumb)}" alt="" width="180" height="100"
        style="display:block;width:180px;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>`
    : ''
  const price = p.priceLabel
    ? `<div style="font-weight:700;color:#010744;margin-top:4px">${escapeHtml(p.priceLabel)}</div>`
    : ''
  return `
    <div style="width:200px;font-family:inherit">
      ${thumb}
      <span style="display:inline-block;background:${tagBg};color:${tagFg};font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 6px;border-radius:4px">${tag}</span>
      <div style="font-weight:700;color:#010744;margin-top:6px;line-height:1.25">${escapeHtml(p.title)}</div>
      ${local ? `<div style="font-size:12px;color:#555;margin-top:2px">${escapeHtml(local)}</div>` : ''}
      ${approxNote}
      ${price}
      <a href="${escapeHtml(p.href)}"
         style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#010744;text-decoration:underline">
        Ver detalhes →
      </a>
    </div>
  `
}

export function LocationsMapClient({
  points,
  bounds,
  center,
  zoom,
  minZoom,
  maxZoom,
}: LocationsMapClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'imovel' | 'empreendimento'>('all')

  useEffect(() => {
    let cancelled = false
    let map: LeafletMap | null = null

    ensureLeafletLoaded()
      .then((L) => {
        if (cancelled || !containerRef.current) return
        if (mapRef.current) return

        const sw = L.latLng(bounds[0][0], bounds[0][1])
        const ne = L.latLng(bounds[1][0], bounds[1][1])
        const llBounds = L.latLngBounds(sw, ne)

        map = L.map(containerRef.current, {
          center,
          zoom,
          minZoom,
          maxZoom,
          maxBounds: llBounds,
          maxBoundsViscosity: 1.0,
          scrollWheelZoom: false,
          zoomControl: true,
          attributionControl: true,
        })
        mapRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom,
          minZoom,
        }).addTo(map)

        for (const p of points) {
          if (filter !== 'all' && p.kind !== filter) continue
          if (!llBounds.contains([p.lat, p.lng])) continue

          const icon = L.divIcon({
            className: 'moreja-divicon',
            html: buildPinHtml(p.kind),
            iconSize: [36, 46],
            iconAnchor: [18, 44],
            popupAnchor: [0, -40],
          })

          L.marker([p.lat, p.lng], { icon })
            .addTo(map)
            .bindPopup(buildPopupHtml(p), { maxWidth: 240 })
        }
      })
      .catch((err: Error) => {
        console.error('[LocationsMap] erro carregando Leaflet:', err)
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
      if (map) {
        map.remove()
        mapRef.current = null
      }
    }
  }, [points, bounds, center, zoom, minZoom, maxZoom, filter])

  const counts = points.reduce(
    (acc, p) => {
      acc[p.kind] += 1
      return acc
    },
    { imovel: 0, empreendimento: 0 } as Record<MapPoint['kind'], number>,
  )

  return (
    <div className="relative">
      {/* Filtros (legenda + toggle) */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap gap-2">
        <FilterChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label={`Todos · ${points.length}`}
          color="#010744"
        />
        <FilterChip
          active={filter === 'imovel'}
          onClick={() => setFilter('imovel')}
          label={`Imóveis · ${counts.imovel}`}
          color="#f2d22e"
          icon={<HomeIcon size={12} aria-hidden="true" />}
          textColor="#010744"
        />
        <FilterChip
          active={filter === 'empreendimento'}
          onClick={() => setFilter('empreendimento')}
          label={`Empreendimentos · ${counts.empreendimento}`}
          color="#010744"
          icon={<Building2 size={12} aria-hidden="true" />}
          textColor="#f2d22e"
        />
      </div>

      <div
        ref={containerRef}
        className="h-[460px] w-full rounded-2xl overflow-hidden border border-[#010744]/10 shadow-sm bg-[#f3f3eb]"
        aria-label="Mapa interativo de imóveis e empreendimentos no Recife"
        role="application"
      />

      {/* Legenda no canto inferior direito — usa os mesmos SVGs dos pins
           reais do mapa, p/ não haver ambiguidade entre o que o usuário vê
           plotado e o que o card descreve. */}
      <div
        className="absolute bottom-4 right-4 z-[400] rounded-lg bg-white/95 backdrop-blur-sm
                   shadow-md border border-[#010744]/10 px-3 py-2.5"
        aria-label="Legenda do mapa"
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#010744]/70 mb-1.5">
          Legenda
        </p>
        <ul className="flex flex-col gap-1.5">
          <li className="flex items-center gap-2 text-xs text-[#010744]">
            <LegendPin kind="imovel" />
            <span className="font-semibold">Imóvel</span>
          </li>
          <li className="flex items-center gap-2 text-xs text-[#010744]">
            <LegendPin kind="empreendimento" />
            <span className="font-semibold">Empreendimento</span>
          </li>
        </ul>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f3f3eb]/90 text-center p-6 rounded-2xl">
          <div>
            <MapPin className="w-8 h-8 text-[#010744]/60 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-gray-700">
              Não foi possível carregar o mapa.
            </p>
            <Link
              href="/comprar?cidade=Recife"
              className="inline-block mt-3 text-sm font-semibold text-[#010744] underline"
            >
              Ver lista de imóveis em Recife
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function LegendPin({ kind }: { kind: MapPoint['kind'] }) {
  // Espelha as cores/ícones de buildPinHtml — mantemos a fonte da verdade
  // ali (Leaflet renderiza o SVG por innerHTML) e replicamos aqui em React
  // só para a legenda. Se mudar um, mude o outro.
  const isEmp = kind === 'empreendimento'
  const fill = isEmp ? '#010744' : '#f2d22e'
  const stroke = isEmp ? '#f2d22e' : '#010744'
  const iconColor = isEmp ? '#f2d22e' : '#010744'

  return (
    <svg
      width="20"
      height="26"
      viewBox="0 0 36 46"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0 drop-shadow-sm"
    >
      <path
        d="M18 0C8.1 0 0 8 0 17.8c0 13.2 16.2 27 16.9 27.6a1.7 1.7 0 0 0 2.2 0C19.8 44.8 36 31 36 17.8 36 8 27.9 0 18 0Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />
      <circle cx="18" cy="17.5" r="9.5" fill={stroke} />
      <g
        transform="translate(10 9.5) scale(0.67)"
        fill="none"
        stroke={iconColor}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isEmp ? (
          // Building2 (lucide)
          <>
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
            <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
          </>
        ) : (
          // Home (lucide)
          <>
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </>
        )}
      </g>
    </svg>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  color,
  textColor,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  color: string
  textColor?: string
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold
                  shadow-sm transition-all border
                  ${
                    active
                      ? 'ring-2 ring-offset-1 ring-[#010744]/40'
                      : 'opacity-90 hover:opacity-100'
                  }`}
      style={{
        background: color,
        color: textColor ?? '#fff',
        borderColor: textColor ?? '#fff',
      }}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  )
}
