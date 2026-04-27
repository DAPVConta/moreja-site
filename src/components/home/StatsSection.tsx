import {
  Gem, BadgeCheck, Sparkles, Trophy, Building, KeyRound,
  TrendingUp, HeartHandshake, ShieldCheck, MapPinned, Users2, Award,
} from 'lucide-react'
import type { SiteStat } from '@/types/site'
import { Reveal } from '@/components/ui/Reveal'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

// Ícones modernos com stroke médio; alias antigos mantidos p/ compatibilidade
const iconMap: Record<string, React.ReactNode> = {
  // Tempo / experiência
  calendar:       <Award        size={28} strokeWidth={1.75} aria-hidden="true" />,
  trophy:         <Trophy       size={28} strokeWidth={1.75} aria-hidden="true" />,
  badge:          <BadgeCheck   size={28} strokeWidth={1.75} aria-hidden="true" />,
  shield:         <ShieldCheck  size={28} strokeWidth={1.75} aria-hidden="true" />,
  // Imóveis
  home:           <KeyRound     size={28} strokeWidth={1.75} aria-hidden="true" />,
  building:       <Building     size={28} strokeWidth={1.75} aria-hidden="true" />,
  gem:            <Gem          size={28} strokeWidth={1.75} aria-hidden="true" />,
  sparkles:       <Sparkles     size={28} strokeWidth={1.75} aria-hidden="true" />,
  // Clientes / satisfação
  heart:          <HeartHandshake size={28} strokeWidth={1.75} aria-hidden="true" />,
  trending:       <TrendingUp   size={28} strokeWidth={1.75} aria-hidden="true" />,
  // Equipe
  users:          <Users2       size={28} strokeWidth={1.75} aria-hidden="true" />,
  location:       <MapPinned    size={28} strokeWidth={1.75} aria-hidden="true" />,
}

const defaultStats: SiteStat[] = [
  { id: '1', key: 'anos_mercado',         value: '10',   label: 'Anos de Mercado',          icon: 'calendar', sort_order: 1 },
  { id: '2', key: 'imoveis_vendidos',     value: '500+', label: 'Imóveis Vendidos',          icon: 'home',     sort_order: 2 },
  { id: '3', key: 'clientes_satisfeitos', value: '98%',  label: 'Clientes Satisfeitos',      icon: 'heart',    sort_order: 3 },
  { id: '4', key: 'corretores',           value: '15',   label: 'Corretores Especializados', icon: 'users',    sort_order: 4 },
]

interface StatsSectionProps {
  stats?: SiteStat[]
}

export function StatsSection({ stats = defaultStats }: StatsSectionProps) {
  const displayStats = stats.length > 0 ? stats : defaultStats

  return (
    <section className="section bg-[#ededd1] relative overflow-hidden">
      {/* Decorative pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 50%, #010744 0, transparent 30%), radial-gradient(circle at 85% 50%, #010744 0, transparent 30%)',
        }}
      />

      <div className="container-page relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
          {displayStats.map((stat, i) => (
            <Reveal
              key={stat.key}
              delay={i * 80}
              className="group text-center"
            >
              {/* Icon in elegant circular badge */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div
                  className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#010744] to-[#1a1f6e] shadow-lg shadow-[#010744]/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-[#010744]/30"
                >
                  {/* Gold accent corner */}
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#f2d22e] ring-2 ring-[#ededd1]"
                  />
                  <span className="text-[#f2d22e]">
                    {iconMap[stat.icon] ?? iconMap.home}
                  </span>
                </div>
              </div>

              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-[#010744] mb-1 tracking-tight leading-none">
                <AnimatedNumber value={stat.value} />
              </p>
              <p className="text-xs sm:text-sm text-gray-700 font-semibold tracking-wide">
                {stat.label}
              </p>

              {/* Thin gold underline */}
              <div className="flex justify-center mt-3">
                <span className="h-0.5 w-8 rounded-full bg-[#f2d22e]/60 transition-all duration-300 group-hover:w-12 group-hover:bg-[#f2d22e]" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
