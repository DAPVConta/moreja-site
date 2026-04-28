import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Calendar, MapPin } from 'lucide-react'

interface Launch {
  id: string
  name: string
  developer?: string
  location: string
  status: string // "Lançamento", "Em obras", "Pré-lançamento"
  delivery?: string
  priceFrom?: string
  image: string
  href?: string
}

interface LaunchesPreviewProps {
  title?: string
  subtitle?: string
  hrefAll?: string
  launches?: Launch[]
}

const defaultLaunches: Launch[] = [
  {
    id: '1',
    name: 'Residencial Aurora Vista',
    developer: 'Construtora Alfa',
    location: 'Tatuapé, São Paulo',
    status: 'Lançamento',
    delivery: 'Entrega 2027',
    priceFrom: 'A partir de R$ 580 mil',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&q=80',
  },
  {
    id: '2',
    name: 'Edifício Horizonte',
    developer: 'Moreja Empreendimentos',
    location: 'Vila Olímpia, São Paulo',
    status: 'Em obras',
    delivery: 'Entrega 2026',
    priceFrom: 'A partir de R$ 920 mil',
    image: 'https://images.unsplash.com/photo-1518883529677-4dcae62cf45e?w=1000&q=80',
  },
  {
    id: '3',
    name: 'Park Residence Club',
    developer: 'Construtora Beta',
    location: 'Santana, São Paulo',
    status: 'Pré-lançamento',
    delivery: 'Previsão 2028',
    priceFrom: 'Sob consulta',
    image: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1000&q=80',
  },
]

export function LaunchesPreview({
  title = 'Lançamentos exclusivos',
  subtitle = 'Empreendimentos com condições especiais direto da construtora',
  hrefAll = '/empreendimentos',
  launches = defaultLaunches,
}: LaunchesPreviewProps) {
  return (
    <section className="section relative overflow-hidden bg-[#010744] text-white">
      {/* Decorative dotted pattern overlay (sutil, premium feel) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Yellow blob no canto */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full
                   bg-[#f2d22e]/10 blur-3xl"
      />

      <div className="relative container-page">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase
                            text-[#010744] bg-[#f2d22e] rounded-full px-3 py-1 mb-3">
              <Sparkles size={14} aria-hidden="true" />
              Lançamentos
            </div>
            <h2 className="heading-h2 text-white mb-2">{title}</h2>
            <p className="lead text-gray-300 mb-0">{subtitle}</p>
          </div>
          <Link
            href={hrefAll}
            className="flex items-center gap-2 text-[#f2d22e] font-semibold hover:text-white transition-colors group shrink-0"
          >
            Ver todos empreendimentos
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {launches.map((l, idx) => (
            <Link
              key={l.id}
              href={l.href ?? hrefAll}
              className="group relative rounded-2xl overflow-hidden bg-white text-[#010744]
                         shadow-lg shadow-black/30 transition-all duration-300
                         hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 block"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={l.image}
                  alt={l.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority={idx === 0}
                />
                <div
                  className="absolute top-3 left-3 bg-[#f2d22e] text-[#010744] text-[10px]
                             font-bold uppercase tracking-wider px-2 py-1 rounded"
                >
                  {l.status}
                </div>
                {/* Subtle gradient at bottom of image for legibility ANIME */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold leading-tight mb-1">{l.name}</h3>
                {l.developer && (
                  <p className="text-xs text-gray-500 mb-3">{l.developer}</p>
                )}
                <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#f2d22e] shrink-0" aria-hidden="true" />
                    {l.location}
                  </p>
                  {l.delivery && (
                    <p className="flex items-center gap-2">
                      <Calendar
                        size={14}
                        className="text-[#f2d22e] shrink-0"
                        aria-hidden="true"
                      />
                      {l.delivery}
                    </p>
                  )}
                </div>
                {l.priceFrom && (
                  <p className="text-sm font-semibold border-t border-gray-100 pt-3">
                    {l.priceFrom}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
