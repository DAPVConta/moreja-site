import {
  Gem, BadgeCheck, Sparkles, Trophy, Building, KeyRound,
  TrendingUp, HeartHandshake, ShieldCheck, MapPinned, Users2, Award,
} from 'lucide-react'
import type { SiteStat } from '@/types/site'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Sparkline } from '@/components/ui/Sparkline'

// ─── Icon map ────────────────────────────────────────────────────────────────
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

// ─── Defaults ─────────────────────────────────────────────────────────────────
const defaultStats: SiteStatWithTrend[] = [
  { id: '1', key: 'anos_mercado',         value: '10',   label: 'Anos de Mercado',          icon: 'calendar', sort_order: 1 },
  { id: '2', key: 'imoveis_vendidos',     value: '500+', label: 'Imóveis Vendidos',          icon: 'home',     sort_order: 2 },
  { id: '3', key: 'clientes_satisfeitos', value: '98%',  label: 'Clientes Satisfeitos',      icon: 'heart',    sort_order: 3 },
  { id: '4', key: 'corretores',           value: '15',   label: 'Corretores Especializados', icon: 'users',    sort_order: 4 },
]

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Extensão de SiteStat com campo opcional `trend`.
 * Retro-compatível: SiteStat sem `trend` é aceito; a sparkline gera pontos
 * automaticamente quando `trend` está ausente.
 *
 * O campo pode ser populado via JSONB no banco (home_sections.config.stats[]
 * ou site_stats.trend) quando o backend-supabase agent expor o campo.
 */
export interface SiteStatWithTrend extends SiteStat {
  /**
   * 4–12 valores numéricos para a sparkline.
   * Omitir → Sparkline gera curva ease-out plausível.
   */
  trend?: number[]
}

interface StatsSectionProps {
  /** Array de stats (contrato com getSiteStats() — não alterar shape base). */
  stats?: SiteStatWithTrend[]
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StatsSection — faixa de 4 métricas com:
 * - Tabular numbers (tnum + lnum) via font-feature-settings
 * - Sparkline SVG animada ao fundo de cada stat
 * - Entrada CSS animation-timeline: view() com fallback @keyframes
 * - Separator vertical entre itens no desktop (lg:divide-x)
 * - Badge gradient navy + pin amarelo, AnimatedNumber, gold underline
 *
 * @supports (animation-timeline: view()):
 *   Usa scroll-driven animation nativa — sem JS para reveal.
 * @else:
 *   Usa @keyframes fade-slide-up com animation-delay escalonado.
 */
export function StatsSection({ stats = defaultStats }: StatsSectionProps) {
  const displayStats = stats.length > 0 ? stats : defaultStats

  return (
    <section className="section bg-[#ededd1] relative overflow-hidden stats-section">
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
        {/*
          lg:divide-x lg:divide-[#010744]/8 — separadores verticais editoriais
          no desktop. Em mobile some (divide aplica apenas via lg:).
          Cada filho precisa de lg:px para que a border não cole no conteúdo.
        */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 lg:divide-x lg:divide-[#010744]/8">
          {displayStats.map((stat, i) => (
            <StatCard
              key={stat.key}
              stat={stat}
              index={i}
            />
          ))}
        </div>
      </div>

      {/*
        Estilos de animação de entrada injetados como <style> inline para
        isolar do CSS global e não poluir outros componentes.

        Estratégia dual:
        1. @supports (animation-timeline: view()) — CSS nativo, sem JS.
           Cada .stat-card recebe animation-timeline:view() + range-start/end.
        2. Fallback: @keyframes simples + animation-delay escalonado.
           Ativado quando animation-timeline não é suportado.
      */}
      <style>{statsSectionStyles}</style>
    </section>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  stat: SiteStatWithTrend
  index: number
}

function StatCard({ stat, index }: StatCardProps) {
  return (
    <div
      className="stat-card group text-center relative lg:px-6 first:lg:pl-0 last:lg:pr-0"
      style={{ '--stat-index': index } as React.CSSProperties}
    >
      {/* Sparkline background — aria-hidden, puramente decorativo */}
      <Sparkline
        points={stat.trend}
        color="navy"
        opacity={0.1}
        strokeWidth={1.5}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Icon badge */}
      <div className="flex justify-center mb-3 sm:mb-4 relative">
        <div
          className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#010744] to-[#1a1f6e] shadow-lg shadow-[#010744]/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-[#010744]/30"
        >
          {/* Gold accent corner pin */}
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#f2d22e] ring-2 ring-[#ededd1]"
          />
          <span className="text-[#f2d22e]">
            {iconMap[stat.icon] ?? iconMap.home}
          </span>
        </div>
      </div>

      {/*
        Tabular numbers via font-feature-settings: 'tnum' 1, 'lnum' 1
        Garante alinhamento perfeito de dígitos durante a animação do
        AnimatedNumber (evita layout shift horizontal).
      */}
      <p
        className="text-3xl sm:text-4xl md:text-5xl font-black text-[#010744] mb-1 tracking-tight leading-none relative"
        style={{ fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}
      >
        <AnimatedNumber value={stat.value} />
      </p>
      <p className="text-xs sm:text-sm text-gray-700 font-semibold tracking-wide relative">
        {stat.label}
      </p>

      {/* Thin gold underline — cresce ao hover */}
      <div className="flex justify-center mt-3 relative">
        <span className="h-0.5 w-8 rounded-full bg-[#f2d22e]/60 transition-all duration-300 group-hover:w-12 group-hover:bg-[#f2d22e]" />
      </div>
    </div>
  )
}

// ─── Animation styles ─────────────────────────────────────────────────────────

/**
 * Dois sistemas de animação de entrada:
 *
 * 1. CSS scroll-driven (animation-timeline: view()) — Chrome 115+, Edge 115+.
 *    Sem JS, sem hidratação. O card entra quando seu centro cruza 20%–50% do
 *    viewport. Delay escalonado via --stat-index CSS var.
 *
 * 2. Fallback @keyframes + IntersectionObserver-less approach:
 *    Usa animation-delay + animation-fill-mode: both.
 *    Ativado pelo @supports negativo (navegadores sem animation-timeline).
 *
 * prefers-reduced-motion: globals.css já seta transition-duration: 0.01ms,
 * portanto as animations são neutralizadas automaticamente.
 */
const statsSectionStyles = `
  /* ── Keyframe base (usada pelos dois sistemas) ── */
  @keyframes stat-fade-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── Fallback: animação escalonada simples ── */
  @supports not (animation-timeline: view()) {
    .stat-card {
      animation: stat-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stat-index, 0) * 80ms + 100ms);
    }
  }

  /* ── Nativo: scroll-driven animation ── */
  @supports (animation-timeline: view()) {
    .stat-card {
      animation: stat-fade-up linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 35%;
      /* Escalonamento sutil via delay positivo (não afeta a range, só o start) */
      animation-delay: calc(var(--stat-index, 0) * 40ms);
    }
  }
`
