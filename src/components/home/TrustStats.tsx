import { Globe, Award, Clock } from 'lucide-react'

interface TrustStatItem {
  value: string
  label: string
}

interface TrustStatsProps {
  title?: string
  items?: TrustStatItem[]
}

const defaultItems: TrustStatItem[] = [
  { value: '15+',    label: 'anos de experiência no mercado' },
  { value: '2.000+', label: 'imóveis intermediados' },
  { value: '1',      label: 'novo lar entregue a cada 3 dias' },
]

const icons = [
  <Award key="a" className="w-9 h-9 text-[#f2d22e]" aria-hidden="true" />,
  <Globe key="b" className="w-9 h-9 text-[#f2d22e]" aria-hidden="true" />,
  <Clock key="c" className="w-9 h-9 text-[#f2d22e]" aria-hidden="true" />,
]

export function TrustStats({
  title = 'Uma rede que você pode confiar',
  items = defaultItems,
}: TrustStatsProps) {
  return (
    <section className="bg-[#010744] text-white py-20 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #f2d22e 0, transparent 40%), radial-gradient(circle at 80% 80%, #f2d22e 0, transparent 40%)',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold mb-12">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {items.map((item, i) => (
            <div
              key={i}
              className="text-center flex flex-col items-center gap-3 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#f2d22e]/50 transition-colors"
            >
              <div>{icons[i % icons.length]}</div>
              <p className="text-4xl md:text-5xl font-black text-[#f2d22e] leading-none">
                {item.value}
              </p>
              <p className="text-sm md:text-base text-white/80 leading-snug max-w-[220px]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
