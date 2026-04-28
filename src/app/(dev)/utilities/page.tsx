'use client'

/**
 * Smoke-test page for Phase 0 UI primitives.
 * Route: /utilities  (dev-only — retorna 404 em produção via guard abaixo)
 *
 * Visual checks:
 * 1. Carousel — loop, autoplay, prev/next, dots, progress ring
 * 2. AnimatedChip — three variants + icon, with/without pulse
 * 3. MagneticButton — three variants × three sizes, anchor usage
 * 4. Mesh gradients — three bg-mesh-* utility classes side by side
 */

import { notFound } from 'next/navigation'
import * as React from 'react'

if (process.env.NODE_ENV === 'production') {
  notFound()
}
import { Home, Sparkles, MapPin, ArrowRight } from 'lucide-react'
import {
  Carousel,
  CarouselItem,
  CarouselViewport,
  CarouselPrev,
  CarouselNext,
  CarouselDotsEmbla as CarouselDots,
  CarouselProgress,
  useCarousel,
  AnimatedChip,
  MagneticButton,
} from '@/components/ui'

// ─── Slide colours for demo ───────────────────────────────────────────────────
const SLIDES = [
  { bg: 'bg-[#010744]', text: 'text-white', label: 'Slide 1 — navy' },
  { bg: 'bg-[#f2d22e]', text: 'text-[#010744]', label: 'Slide 2 — yellow' },
  { bg: 'bg-[#ededd1]', text: 'text-[#010744]', label: 'Slide 3 — cream' },
]

// ─── Carousel demo controls (rendered inside CarouselProvider context) ────────
function CarouselControls({ delay: _delay }: { delay: number }) {
  const { selectedIndex, scrollSnaps } = useCarousel()
  return (
    <div className="mt-4 flex items-center justify-between gap-4 px-1">
      <div className="flex items-center gap-2">
        <CarouselPrev size="sm" />
        <CarouselNext size="sm" />
      </div>
      <div className="flex items-center gap-3">
        <CarouselDots variant="navy" />
        <div className="flex items-center gap-1.5">
          <CarouselProgress size={32} strokeWidth={3} color="yellow" />
          <span className="text-xs text-gray-500 tabular-nums">
            {selectedIndex + 1} / {scrollSnaps.length}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UtilitiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6 space-y-16">

        {/* Header */}
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
            Phase 0 — Smoke Test
          </p>
          <h1 className="text-3xl font-extrabold text-[#010744] tracking-tight">
            UI Primitive Gallery
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            Visual check for Carousel, AnimatedChip, MagneticButton and mesh gradient utilities.
          </p>
        </header>

        {/* ─── 1. Carousel ─────────────────────────────────────────────── */}
        <section>
          <SectionLabel>1. Carousel</SectionLabel>

          {/* Full-feature: loop + autoplay + progress ring */}
          <div className="mb-8">
            <p className="text-xs text-gray-400 mb-3">Loop + autoplay (3 000 ms) + progress ring + dots</p>
            <Carousel
              options={{ loop: true }}
              autoplay={3000}
              className="w-full max-w-xl"
            >
              <CarouselViewport className="rounded-2xl">
                {SLIDES.map((s, i) => (
                  <CarouselItem key={i}>
                    <div className={`${s.bg} ${s.text} h-48 flex items-center justify-center rounded-2xl text-lg font-semibold`}>
                      {s.label}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselViewport>
              <CarouselControls delay={3000} />
            </Carousel>
          </div>

          {/* 2-up slides, no loop */}
          <div>
            <p className="text-xs text-gray-400 mb-3">2-up (basis 50%), no loop, no autoplay</p>
            <Carousel
              options={{ loop: false, align: 'start' }}
              className="w-full max-w-xl"
            >
              <CarouselViewport className="rounded-2xl">
                {SLIDES.map((s, i) => (
                  <CarouselItem key={i} basis="50%">
                    <div className={`${s.bg} ${s.text} h-32 mx-1 flex items-center justify-center rounded-xl text-sm font-semibold`}>
                      {s.label}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselViewport>
              <div className="mt-3 flex items-center gap-2">
                <CarouselPrev size="sm" />
                <CarouselNext size="sm" />
                <CarouselDots variant="navy" className="ml-2" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* ─── 2. AnimatedChip ─────────────────────────────────────────── */}
        <section>
          <SectionLabel>2. AnimatedChip</SectionLabel>
          <div className="flex flex-wrap gap-4 items-center">
            {/* gold — default */}
            <AnimatedChip icon={Sparkles}>Lançamentos</AnimatedChip>
            {/* gold no pulse */}
            <AnimatedChip pulse={false}>Destaques</AnimatedChip>
            {/* gold with icon */}
            <AnimatedChip icon={MapPin}>Recife</AnimatedChip>
          </div>

          <div className="flex flex-wrap gap-4 items-center mt-4 p-4 bg-[#ededd1] rounded-xl">
            {/* navy */}
            <AnimatedChip variant="navy" icon={Home}>Residencial</AnimatedChip>
            <AnimatedChip variant="navy" pulse={false}>Comercial</AnimatedChip>
          </div>

          <div className="flex flex-wrap gap-4 items-center mt-4 p-4 bg-[#010744] rounded-xl">
            {/* ghost — on navy bg */}
            <AnimatedChip variant="ghost" icon={Sparkles}>Exclusivo</AnimatedChip>
            <AnimatedChip variant="ghost" pulse={false}>Premium</AnimatedChip>
          </div>
        </section>

        {/* ─── 3. MagneticButton ───────────────────────────────────────── */}
        <section>
          <SectionLabel>3. MagneticButton</SectionLabel>
          <p className="text-xs text-gray-400 mb-4">
            Hover slowly over each button — the magnetic pull is visible on desktop with fine pointer.
          </p>

          {/* Gold */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <MagneticButton variant="gold" size="sm">Buscar (sm)</MagneticButton>
            <MagneticButton variant="gold" size="md">Buscar imóvel (md)</MagneticButton>
            <MagneticButton variant="gold" size="lg" >
              Buscar imóvel agora (lg)
              <ArrowRight className="h-5 w-5" />
            </MagneticButton>
          </div>

          {/* Navy */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <MagneticButton variant="navy" size="sm">Anunciar (sm)</MagneticButton>
            <MagneticButton variant="navy" size="md">Anunciar imóvel (md)</MagneticButton>
            <MagneticButton variant="navy" size="lg">Anunciar imóvel agora (lg)</MagneticButton>
          </div>

          {/* Ghost */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <MagneticButton variant="ghost" size="sm">Saiba mais (sm)</MagneticButton>
            <MagneticButton variant="ghost" size="md">Saiba mais (md)</MagneticButton>
          </div>

          {/* As anchor */}
          <div className="flex flex-wrap items-center gap-4">
            <MagneticButton as="a" href="#" variant="gold" size="md">
              Link anchor (gold)
            </MagneticButton>
            <MagneticButton as="a" href="#" variant="navy" size="md">
              Link anchor (navy)
            </MagneticButton>
          </div>
        </section>

        {/* ─── 4. Mesh Gradients ───────────────────────────────────────── */}
        <section>
          <SectionLabel>4. Mesh Gradient Backgrounds</SectionLabel>
          <p className="text-xs text-gray-400 mb-4">
            Add <code className="bg-gray-100 px-1 rounded">.bg-mesh-cream</code>,{' '}
            <code className="bg-gray-100 px-1 rounded">.bg-mesh-navy</code>, or{' '}
            <code className="bg-gray-100 px-1 rounded">.bg-mesh-white</code> to any section.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MeshSwatch
              className="bg-mesh-cream"
              label=".bg-mesh-cream"
              textColor="text-[#010744]"
            />
            <MeshSwatch
              className="bg-mesh-navy"
              label=".bg-mesh-navy"
              textColor="text-white"
            />
            <MeshSwatch
              className="bg-mesh-white border border-gray-200"
              label=".bg-mesh-white"
              textColor="text-[#010744]"
            />
          </div>
        </section>

        {/* Footer note */}
        <footer className="pb-8 text-xs text-gray-400">
          This page lives at <code>/utilities</code> via the <code>(dev)</code> route group.
          Remove or protect it before deploying to production.
        </footer>
      </div>
    </div>
  )
}

// ─── Local helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[#010744] mb-4 pb-2 border-b border-gray-200">
      {children}
    </h2>
  )
}

function MeshSwatch({
  className,
  label,
  textColor,
}: {
  className: string
  label: string
  textColor: string
}) {
  return (
    <div className={`${className} rounded-2xl p-6 flex flex-col justify-between min-h-[120px]`}>
      <span className={`text-xs font-mono font-semibold ${textColor} opacity-70`}>{label}</span>
      <span className={`text-xs ${textColor} opacity-50 mt-4`}>
        Radial mesh — max 8% hotspot opacity
      </span>
    </div>
  )
}
