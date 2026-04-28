import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'

interface CoverageRegion {
  name: string
  slug: string
  /** Contagem de imóveis ativos (alimenta urgência "47 imóveis ativos"). */
  count?: number
  highlight?: boolean
}

interface CoverageMapProps {
  title?: string
  subtitle?: string
  regions: CoverageRegion[]
  cityLabel?: string
  /** Link "Ver todos os bairros" (default /bairros). */
  ctaHref?: string
}

/**
 * Mapa de cobertura simplificado — pattern RE/MAX. Responde à pergunta
 * tácita do cliente: "vocês conhecem meu bairro?".
 *
 * Sem Mapbox/Google Maps (zero JS). Layout: 2 colunas — esquerda com
 * decorative aerial-style background + lista de bairros; direita com
 * pitch + CTA de avaliação.
 */
export function CoverageMap({
  title = 'Onde a Morejá atua',
  subtitle = 'Conhecemos cada esquina, cada empreendimento, cada movimento de mercado nas regiões abaixo.',
  regions,
  cityLabel = 'Recife e região metropolitana',
  ctaHref = '/bairros',
}: CoverageMapProps) {
  if (regions.length === 0) return null

  return (
    <section className="section bg-[#010744] text-white relative overflow-hidden">
      {/* Decorative dotted overlay (consistente com LaunchesPreview) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full
                   bg-[#f2d22e]/10 blur-3xl"
      />

      <div className="relative container-page">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 items-center">
          {/* Coluna esquerda: pitch */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f2d22e] px-3 py-1
                             text-xs font-bold uppercase tracking-widest text-[#010744] mb-4">
              <MapPin size={14} aria-hidden="true" />
              Cobertura local
            </span>
            <h2 className="heading-h2 text-white mb-3">{title}</h2>
            <p className="lead text-gray-300 mb-6 max-w-xl">{subtitle}</p>

            <p className="text-sm font-semibold uppercase tracking-wider text-[#f2d22e] mb-3">
              {cityLabel}
            </p>

            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 text-[#f2d22e] font-semibold
                         transition-colors hover:text-white group"
            >
              Ver guia de bairros
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* Coluna direita: lista de bairros */}
          <div className="grid grid-cols-2 gap-2">
            {regions.map((r) => (
              <Link
                key={r.slug}
                href={`/comprar?bairro=${encodeURIComponent(r.name)}`}
                className={`group flex flex-col gap-1 rounded-xl border p-4 transition-all
                            ${
                              r.highlight
                                ? 'border-[#f2d22e]/40 bg-[#f2d22e]/10 hover:bg-[#f2d22e]/20'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white truncate">{r.name}</span>
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-[#f2d22e] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
                {r.count != null && r.count > 0 && (
                  <span className="text-xs text-gray-300">
                    {r.count} {r.count === 1 ? 'imóvel ativo' : 'imóveis ativos'}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
