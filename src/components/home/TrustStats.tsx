'use client'

/**
 * TrustStats — trajetória da Morejá em timeline horizontal/vertical.
 *
 * Desktop (lg+): 4 milestones em linha horizontal, conectados por linha
 *   amarela contínua atrás. Cards alternam acima/abaixo (zigue-zague).
 *   Cada milestone anima sequencialmente ao entrar no viewport
 *   via Framer Motion whileInView.
 *
 * Mobile (<lg): timeline vertical — linha à esquerda, cards à direita.
 *
 * API de props preservada:
 *   - title?  — título da seção.
 *   - items?  — array de TrustStatItem; campo `year?` opcional.
 *     Fallback automático: usa timeline default quando items não possuem year.
 *
 * prefers-reduced-motion: desativa entry animation e dot pulse.
 */

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrustStatItem {
  value: string
  label: string
  year?: string
}

interface TrustStatsProps {
  title?: string
  items?: TrustStatItem[]
}

// ─── Default timeline data ────────────────────────────────────────────────────

interface Milestone {
  year: string
  title: string
  description: string
}

const defaultMilestones: Milestone[] = [
  {
    year:        '2009',
    title:       'Fundação',
    description: 'Morejá nasce com o propósito de transformar o mercado imobiliário.',
  },
  {
    year:        '2018',
    title:       '500 imóveis',
    description: 'Alcançamos meio milhar de imóveis intermediados com sucesso.',
  },
  {
    year:        '2024',
    title:       '2.000 negócios',
    description: 'Mais de 2.000 famílias encontraram seu lar com a Morejá.',
  },
  {
    year:        '2025',
    title:       '1 lar a cada 3 dias',
    description: 'Ritmo acelerado — realizando sonhos dia após dia.',
  },
]

/**
 * Converte items da API antiga (sem year) em milestones com fallback.
 * Regra: quando ≥ 1 item possui year, usa-os diretamente.
 * Quando nenhum possui year, usa defaultMilestones (ignorando items).
 */
function toMilestones(items: TrustStatItem[]): Milestone[] {
  const hasYear = items.some((it) => Boolean(it.year))
  if (hasYear) {
    return items.slice(0, 4).map((it, i) => ({
      year:        it.year ?? String(2009 + i * 5),
      title:       it.label,
      description: it.value,
    }))
  }
  // Old format (value + label only) — map to milestones using defaults as template
  // and inject the actual values as descriptions.
  return defaultMilestones.map((def, i) => ({
    ...def,
    description: items[i]?.value ?? def.description,
    title:       items[i]?.label ?? def.title,
  }))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MilestoneCardProps {
  milestone: Milestone
  index: number
  above: boolean   // desktop only: card above or below the timeline line
}

function MilestoneCard({ milestone, index, above }: MilestoneCardProps) {
  const ref  = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: above ? -16 : 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      // prefers-reduced-motion handled by CSS in globals.css (duration → 0.01ms)
      className={[
        'bg-white/10 border border-white/15 rounded-xl px-4 py-4',
        'backdrop-blur-sm hover:border-[#f2d22e]/40 transition-colors duration-200',
        'max-w-[200px]',
      ].join(' ')}
    >
      <p className="text-[#f2d22e] font-black text-2xl leading-none mb-1 tabular-nums">
        {milestone.year}
      </p>
      <p className="text-white font-semibold text-sm leading-snug mb-1">
        {milestone.title}
      </p>
      <p className="text-white/60 text-xs leading-snug">
        {milestone.description}
      </p>
    </motion.div>
  )
}

interface MilestoneDotProps {
  inView: boolean
}

function MilestoneDot({ inView }: MilestoneDotProps) {
  return (
    <div
      className={[
        'relative z-10 w-4 h-4 rounded-full bg-[#f2d22e] ring-2 ring-[#f2d22e]/40',
        'flex-shrink-0',
        inView ? 'trust-dot-pulse' : '',
      ].join(' ')}
      aria-hidden="true"
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrustStats({
  title = 'Nossa trajetória',
  items,
}: TrustStatsProps) {
  const milestones = items && items.length > 0 ? toMilestones(items) : defaultMilestones

  // Single inView ref for the whole section (triggers dot pulses)
  const sectionRef = useRef<HTMLElement>(null)
  const sectionInView = useInView(sectionRef, { once: true, margin: '0px 0px -10% 0px' })

  return (
    <section
      ref={sectionRef}
      className="section bg-mesh-navy text-white relative overflow-hidden"
      aria-label={title}
    >
      {/* Dotted background pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #f2d22e 1px, transparent 1px)',
          backgroundSize:  '28px 28px',
        }}
      />

      <div className="container-page relative">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="eyebrow text-[#f2d22e]">Trajetória</span>
          <h2 className="heading-h2 text-white mt-1">{title}</h2>
        </div>

        {/* ── Desktop: horizontal timeline ────────────────────────────── */}
        <div className="hidden lg:block" aria-label="Timeline de marcos da empresa">
          {/* Cards acima (odd indices: 0 e 2) */}
          <div className="flex justify-between items-end mb-4 px-10">
            {milestones.map((m, i) =>
              i % 2 === 0 ? (
                <div key={`top-${i}`} className="flex-1 flex justify-center">
                  <MilestoneCard milestone={m} index={i} above={true} />
                </div>
              ) : (
                <div key={`top-${i}`} className="flex-1" aria-hidden="true" />
              )
            )}
          </div>

          {/* Timeline bar: dots + connecting line */}
          <div className="relative flex items-center px-10" role="presentation">
            {/* Yellow connecting line behind dots */}
            <div
              className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-0.5 bg-[#f2d22e]/50"
              aria-hidden="true"
            />

            {/* Dots, evenly distributed */}
            <div className="relative z-10 flex w-full justify-between">
              {milestones.map((_, i) => (
                <MilestoneDot key={i} inView={sectionInView} />
              ))}
            </div>
          </div>

          {/* Connector lines (vertical, above ↔ below) and cards below (odd) */}
          {/* We overlay connector lines per-slot, then render bottom cards */}
          <div className="flex justify-between items-start mt-4 px-10">
            {milestones.map((m, i) =>
              i % 2 === 1 ? (
                <div key={`bot-${i}`} className="flex-1 flex justify-center">
                  <MilestoneCard milestone={m} index={i} above={false} />
                </div>
              ) : (
                <div key={`bot-${i}`} className="flex-1" aria-hidden="true" />
              )
            )}
          </div>
        </div>

        {/* ── Mobile: vertical timeline ────────────────────────────────── */}
        <ol
          className="lg:hidden relative space-y-0"
          aria-label="Timeline de marcos da empresa"
        >
          {/* Vertical line */}
          <div
            className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#f2d22e]/40"
            aria-hidden="true"
          />

          {milestones.map((milestone, i) => {
            // Individual inView per item for staggered entry
            return (
              <MilestoneVerticalItem
                key={i}
                milestone={milestone}
                index={i}
                isLast={i === milestones.length - 1}
                sectionInView={sectionInView}
              />
            )
          })}
        </ol>
      </div>
    </section>
  )
}

TrustStats.displayName = 'TrustStats'

// ─── Mobile vertical item ─────────────────────────────────────────────────────

interface MilestoneVerticalItemProps {
  milestone: Milestone
  index: number
  isLast: boolean
  sectionInView: boolean
}

function MilestoneVerticalItem({
  milestone,
  index,
  isLast,
  sectionInView,
}: MilestoneVerticalItemProps) {
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -5% 0px' })

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={['relative flex gap-5 pl-0', isLast ? 'pb-0' : 'pb-8'].join(' ')}
    >
      {/* Dot */}
      <div className="relative flex-shrink-0 mt-1">
        <div
          className={[
            'w-4 h-4 rounded-full bg-[#f2d22e] ring-2 ring-[#f2d22e]/30',
            sectionInView ? 'trust-dot-pulse' : '',
          ].join(' ')}
          aria-hidden="true"
          style={{ animationDelay: `${index * 0.3}s` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 bg-white/8 border border-white/10 rounded-xl px-4 py-3">
        <p className="text-[#f2d22e] font-black text-xl leading-none mb-1 tabular-nums">
          {milestone.year}
        </p>
        <p className="text-white font-semibold text-sm leading-snug mb-0.5">
          {milestone.title}
        </p>
        <p className="text-white/60 text-xs leading-snug">
          {milestone.description}
        </p>
      </div>
    </motion.li>
  )
}
