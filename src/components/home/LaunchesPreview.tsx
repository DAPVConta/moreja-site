import Link from 'next/link'
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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-white bg-gradient-to-r from-[#010744] to-[#1a1f6e] rounded-full px-3 py-1 mb-3">
              <Sparkles size={14} aria-hidden="true" />
              Lançamentos
            </div>
            <h2 className="section-title">{title}</h2>
            <p className="section-subtitle mb-0">{subtitle}</p>
          </div>
          <Link
            href={hrefAll}
            className="flex items-center gap-2 text-[#010744] font-semibold hover:text-[#f2d22e] transition-colors group shrink-0"
          >
            Ver todos empreendimentos
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {launches.map((l) => (
            <Link
              key={l.id}
              href={l.href ?? hrefAll}
              className="group relative rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-xl transition-shadow block"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${l.image}')` }}
                  aria-hidden="true"
                />
                <div className="absolute top-3 left-3 bg-[#f2d22e] text-[#010744] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                  {l.status}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-[#010744] leading-tight mb-1">{l.name}</h3>
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
                      <Calendar size={14} className="text-[#f2d22e] shrink-0" aria-hidden="true" />
                      {l.delivery}
                    </p>
                  )}
                </div>
                {l.priceFrom && (
                  <p className="text-sm font-semibold text-[#010744] border-t border-gray-100 pt-3">
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
