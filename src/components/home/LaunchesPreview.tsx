'use client'

/**
 * LaunchesPreview — Phase 10
 *
 * Upgrades over Phase 9:
 *  - 3D tilt on hover via Framer Motion (useMotionValue + useSpring + useTransform).
 *    Disabled on pointer:coarse and prefers-reduced-motion.
 *  - Progress bar for "Em obras" status (aria-valuenow/min/max).
 *  - Shimmer badge animation when status === "Lançamento".
 *
 * The whole section is 'use client' because TiltCard (the interactive card)
 * needs hooks. The section itself is lightweight enough that the bundle cost
 * is acceptable — no data fetching happens here.
 */

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useCallback, useState, useEffect } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { ArrowRight, MapPin, Calendar } from 'lucide-react'
import { AnimatedChip } from '@/components/ui'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Launch {
  id: string
  name: string
  developer?: string
  location: string
  /** "Lançamento" | "Em obras" | "Pré-lançamento" */
  status: string
  delivery?: string
  priceFrom?: string
  image: string
  href?: string
  /** 0-100, shown as progress bar only when status includes "obras" */
  progress?: number
}

export interface LaunchesPreviewProps {
  title?: string
  subtitle?: string
  hrefAll?: string
  launches?: Launch[]
}

// ─── Default data ─────────────────────────────────────────────────────────────

const defaultLaunches: Launch[] = [
  {
    id: '1',
    name: 'Residencial Aurora Vista',
    developer: 'Morejá Empreendimentos',
    location: 'Boa Viagem, Recife — PE',
    status: 'Lançamento',
    delivery: 'Entrega 2027',
    priceFrom: 'A partir de R$ 580 mil',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    name: 'Edifício Horizonte',
    developer: 'Morejá Empreendimentos',
    location: 'Graças, Recife — PE',
    status: 'Em obras',
    delivery: 'Entrega 2026',
    priceFrom: 'A partir de R$ 920 mil',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    progress: 68,
  },
  {
    id: '3',
    name: 'Park Residence Club',
    developer: 'Morejá Empreendimentos',
    location: 'Casa Forte, Recife — PE',
    status: 'Pré-lançamento',
    delivery: 'Previsão 2028',
    priceFrom: 'Sob consulta',
    image: 'https://images.unsplash.com/photo-1460472178825-e5240623afd5?auto=format&fit=crop&w=800&q=80',
  },
]

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isLaunch = status === 'Lançamento'
  return (
    <span
      className={cn(
        'absolute top-3 left-3 text-[#010744] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded',
        isLaunch ? 'shimmer-badge' : 'bg-[#f2d22e]'
      )}
    >
      {status}
    </span>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(100, progress))
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clamped}% concluído`}
      className="h-1 rounded-full overflow-hidden bg-white/10 mt-2"
    >
      <div
        className="h-full bg-[#f2d22e] rounded-full transition-[width] duration-700"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

// ─── TiltCard ─────────────────────────────────────────────────────────────────

/**
 * Wraps each launch card with a 3D perspective tilt driven by mouse position.
 * Disabled automatically on pointer:coarse and prefers-reduced-motion.
 */
function TiltCard({
  launch,
  hrefAll,
  priority,
}: {
  launch: Launch
  hrefAll: string
  priority: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Detect whether tilt should be active (fine pointer + no reduced motion).
  // Initialised false to avoid SSR/hydration mismatch.
  const [tiltEnabled, setTiltEnabled] = useState(false)

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTiltEnabled(!coarse && !reduced)
  }, [])

  // Raw mouse-offset motion values (pixels from card center)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  // Spring smoothing — matches the MagneticButton spring profile
  const springConfig = { stiffness: 150, damping: 20 }
  const smoothX = useSpring(rawX, springConfig)
  const smoothY = useSpring(rawY, springConfig)

  // Map pixel offset → rotation degrees, clamped to ±8
  const MAX_DEG = 8
  const rotateY = useTransform(smoothX, [-150, 150], [-MAX_DEG, MAX_DEG])
  const rotateX = useTransform(smoothY, [-150, 150], [MAX_DEG, -MAX_DEG])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tiltEnabled || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      rawX.set(e.clientX - (rect.left + rect.width / 2))
      rawY.set(e.clientY - (rect.top + rect.height / 2))
    },
    [tiltEnabled, rawX, rawY]
  )

  const handleMouseLeave = useCallback(() => {
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  const hasProgress =
    typeof launch.progress === 'number' &&
    /obras/i.test(launch.status)

  return (
    /* Outer wrapper captures mouse events and provides the perspective context */
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1000px' }}
      className="rounded-2xl"
    >
      <motion.div
        style={
          tiltEnabled
            ? { rotateX, rotateY, transformStyle: 'preserve-3d' }
            : {}
        }
        className="will-change-transform"
      >
        <Link
          href={launch.href ?? hrefAll}
          className="group relative rounded-2xl overflow-hidden bg-white text-[#010744]
                     shadow-lg shadow-black/30 transition-shadow duration-300
                     hover:shadow-2xl hover:shadow-black/40 block cursor-pointer"
        >
          {/* ── Image ── */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={launch.image}
              alt={launch.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              priority={priority}
            />

            <StatusBadge status={launch.status} />

            {/* Gradient for text legibility at bottom of image */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"
            />
          </div>

          {/* ── Card body ── */}
          <div className="p-5">
            <h3 className="text-lg font-bold leading-tight mb-1">{launch.name}</h3>
            {launch.developer && (
              <p className="text-xs text-gray-500 mb-3">{launch.developer}</p>
            )}

            <div className="space-y-1.5 text-sm text-gray-600 mb-3">
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-[#f2d22e] shrink-0" aria-hidden="true" />
                {launch.location}
              </p>
              {launch.delivery && (
                <p className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#f2d22e] shrink-0" aria-hidden="true" />
                  {launch.delivery}
                </p>
              )}
            </div>

            {/* Progress bar — only for "Em obras" with a progress value */}
            {hasProgress && (
              <ProgressBar progress={launch.progress as number} />
            )}

            {launch.priceFrom && (
              <p className="text-sm font-semibold border-t border-gray-100 pt-3 mt-3">
                {launch.priceFrom}
              </p>
            )}
          </div>
        </Link>
      </motion.div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function LaunchesPreview({
  title = 'Lançamentos exclusivos',
  subtitle = 'Empreendimentos com condições especiais direto da construtora',
  hrefAll = '/empreendimentos',
  launches = defaultLaunches,
}: LaunchesPreviewProps) {
  return (
    <section className="section relative overflow-hidden bg-[#010744] text-white">
      {/* Decorative dotted pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Yellow ambient blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full
                   bg-[#f2d22e]/10 blur-3xl"
      />

      <div className="relative container-page">
        {/* ── Header row ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <AnimatedChip
              icon={Sparkles}
              variant="gold"
              pulse
              className="mb-3"
            >
              Lançamentos
            </AnimatedChip>
            <h2 className="heading-h2 text-white mb-2">{title}</h2>
            <p className="lead text-gray-300 mb-0">{subtitle}</p>
          </div>
          <Link
            href={hrefAll}
            className="flex items-center gap-2 text-[#f2d22e] font-semibold
                       hover:text-white transition-colors group shrink-0
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2
                       focus-visible:ring-offset-[#010744] rounded"
          >
            Ver todos empreendimentos
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {launches.map((launch, idx) => (
            <TiltCard
              key={launch.id}
              launch={launch}
              hrefAll={hrefAll}
              priority={idx === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
