'use client'

/**
 * Smoke-test page for Phase 0, Phase 1, and Phase 2 UI primitives.
 * Route: /utilities  (dev-only — returns 404 in production)
 *
 * Visual checks:
 * Phase 0:
 * 1. Carousel — loop, autoplay, prev/next, dots, progress ring
 * 2. AnimatedChip — three variants + icon, with/without pulse
 * 3. MagneticButton — three variants × three sizes, anchor usage
 * 4. Mesh gradients — three bg-mesh-* utility classes side by side
 *
 * Phase 1:
 * 5. StatsSection — tabular numbers + sparkline + animation-timeline + dividers
 * 6. NewsletterForm — dark variant (Footer) + light variant (inline)
 *
 * Phase 2:
 * 7. PropertyCard v2 — multi-photo slider, favorite button (heart), ViewTransition
 * 8. PropertyCardSkeleton — shimmer sweep (cream→white→cream)
 *
 * Phase 3:
 * 9. HeroSection — AnimatedChip eyebrow, grain overlay, CSS scroll-driven parallax,
 *    cmdk autocomplete (recent searches + suggestion groups), Framer layoutId tab pill
 */

import { notFound } from 'next/navigation'
import * as React from 'react'

if (process.env.NODE_ENV === 'production') {
  notFound()
}
import { Home, Sparkles, MapPin, ArrowRight } from 'lucide-react'
import { HeroSection } from '@/components/home/HeroSection'
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
import { StatsSection } from '@/components/home/StatsSection'
import { NewsletterForm } from '@/components/layout/NewsletterForm'
import { PropertyCard, PropertyCardSkeleton } from '@/components/properties/PropertyCard'
import type { Property } from '@/types/property'

// ─── Slide colours for demo ───────────────────────────────────────────────────
const SLIDES = [
  { bg: 'bg-[#010744]', text: 'text-white', label: 'Slide 1 — navy' },
  { bg: 'bg-[#f2d22e]', text: 'text-[#010744]', label: 'Slide 2 — yellow' },
  { bg: 'bg-[#ededd1]', text: 'text-[#010744]', label: 'Slide 3 — cream' },
]

// ─── Mock properties for Phase 2 demo ────────────────────────────────────────

// Using Supabase bucket thumbnails already in production (safe hostnames).
// Fallback: placehold.co is whitelisted in next.config remotePatterns.
const MOCK_PHOTOS = [
  'https://placehold.co/600x400/010744/f2d22e?text=Foto+1',
  'https://placehold.co/600x400/f2d22e/010744?text=Foto+2',
  'https://placehold.co/600x400/ededd1/010744?text=Foto+3',
  'https://placehold.co/600x400/9fa2d5/ffffff?text=Foto+4',
]

function makeMockProperty(overrides: Partial<Property> & { id: string; titulo: string }): Property {
  return {
    codigo: overrides.id,
    tipo: 'Residencial',
    subtipo: 'Apartamento',
    finalidade: 'Venda',
    preco: 650000,
    bairro: 'Boa Viagem',
    cidade: 'Recife',
    estado: 'PE',
    area_total: 92,
    quartos: 3,
    banheiros: 2,
    vagas: 1,
    descricao: 'Imóvel de demonstração para o smoke-test da Fase 2.',
    fotos: MOCK_PHOTOS,
    destaque: false,
    ...overrides,
  }
}

const MOCK_PROPERTIES: Property[] = [
  makeMockProperty({
    id: 'demo-1',
    titulo: 'Apartamento 3 quartos — Boa Viagem, Recife',
    preco: 650000,
    fotos: MOCK_PHOTOS,
  }),
  makeMockProperty({
    id: 'demo-2',
    titulo: 'Cobertura Duplex com vista para o mar',
    preco: 1_250_000,
    bairro: 'Pina',
    quartos: 4,
    banheiros: 3,
    vagas: 2,
    area_total: 180,
    fotos: [MOCK_PHOTOS[1], MOCK_PHOTOS[2]],
    destaque: true,
  }),
  makeMockProperty({
    id: 'demo-3',
    titulo: 'Studio compacto — 1 quarto',
    preco: 285000,
    bairro: 'Derby',
    quartos: 1,
    banheiros: 1,
    vagas: 0,
    area_total: 38,
    // Only one photo — carousel should NOT render arrows/dots
    fotos: [MOCK_PHOTOS[0]],
  }),
  makeMockProperty({
    id: 'demo-4',
    titulo: 'Sala Comercial — Centro Empresarial',
    preco: 420000,
    tipo: 'Comercial',
    subtipo: 'Sala Comercial',
    finalidade: 'Venda',
    bairro: 'Santo Amaro',
    quartos: 0,
    banheiros: 1,
    vagas: 1,
    area_total: 55,
    fotos: [MOCK_PHOTOS[2], MOCK_PHOTOS[3]],
  }),
  makeMockProperty({
    id: 'demo-fav',
    titulo: 'Imóvel já favoritado (favorito pré-persistido)',
    preco: 780000,
    bairro: 'Aflitos',
    fotos: MOCK_PHOTOS,
  }),
  makeMockProperty({
    id: 'demo-locacao',
    titulo: 'Casa para Locação — Graças',
    finalidade: 'Locação',
    preco: 3500,
    bairro: 'Graças',
    quartos: 3,
    banheiros: 2,
    vagas: 2,
    area_total: 120,
    fotos: [MOCK_PHOTOS[0], MOCK_PHOTOS[1], MOCK_PHOTOS[3]],
  }),
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
            Phase 0 · 1 · 2 · 3 — Smoke Test
          </p>
          <h1 className="text-3xl font-extrabold text-[#010744] tracking-tight">
            UI Primitive Gallery
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            Visual check for Carousel, AnimatedChip, MagneticButton, mesh gradients,
            StatsSection, NewsletterForm, PropertyCard v2, PropertyCardSkeleton shimmer,
            and HeroSection (Phase 3 — cmdk autocomplete, layoutId tabs, CSS parallax, grain).
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

        {/* ─── 5. StatsSection (Phase 1) ───────────────────────────── */}
        <section>
          <SectionLabel>5. StatsSection (Phase 1)</SectionLabel>
          <p className="text-xs text-gray-400 mb-4">
            Tabular numbers · sparkline SVG animada · animation-timeline nativo · dividers desktop
          </p>

          {/* Default data (4 stats sem trend — gera curva automática) */}
          <div className="-mx-6">
            <StatsSection />
          </div>

          {/* Com trend explícito */}
          <div className="-mx-6 mt-4">
            <StatsSection
              stats={[
                { id: '1', key: 'anos', value: '10', label: 'Anos de Mercado', icon: 'calendar', sort_order: 1, trend: [1, 2, 3, 5, 6, 8, 9, 10] },
                { id: '2', key: 'vendas', value: '500+', label: 'Imóveis Vendidos', icon: 'home', sort_order: 2, trend: [50, 150, 230, 310, 380, 430, 470, 500] },
                { id: '3', key: 'satisf', value: '98%', label: 'Clientes Satisfeitos', icon: 'heart', sort_order: 3, trend: [60, 72, 80, 87, 91, 94, 96, 98] },
                { id: '4', key: 'corr', value: '15', label: 'Corretores', icon: 'users', sort_order: 4, trend: [3, 5, 7, 9, 11, 12, 14, 15] },
              ]}
            />
          </div>
        </section>

        {/* ─── 6. NewsletterForm (Phase 1) ─────────────────────────── */}
        <section>
          <SectionLabel>6. NewsletterForm (Phase 1)</SectionLabel>
          <p className="text-xs text-gray-400 mb-6">
            Button embedded · gradient border no focus · animated check SVG · social proof
          </p>

          {/* Dark variant — contexto Footer (fundo navy) */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-3">
              variant="dark" — usado no Footer (fundo navy)
            </p>
            <div className="bg-[#010744] rounded-2xl p-8 max-w-sm">
              <NewsletterForm variant="dark" subscribersCount={1247} />
            </div>
          </div>

          {/* Light variant — contexto inline / banner claro */}
          <div>
            <p className="text-xs text-gray-400 mb-3">
              variant="light" — usado em banners claros
            </p>
            <div className="bg-[#ededd1] rounded-2xl p-8 max-w-sm">
              <NewsletterForm variant="light" subscribersCount={1247} />
            </div>
          </div>
        </section>

        {/* ─── 7. PropertyCard v2 (Phase 2) ────────────────────────── */}
        <section>
          <SectionLabel>7. PropertyCard v2 (Phase 2)</SectionLabel>

          <p className="text-xs text-gray-400 mb-2">
            Photo slider (arrows appear on hover) · FavoriteButton (yellow heart, useOptimistic) ·
            ViewTransition name on first photo · shimmer skeleton.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Check: click heart = instant yellow fill; hover card = arrows appear; tab to arrows = yellow focus ring.
          </p>

          {/* Full grid — 4 cards, 2 cols on md, 3 cols on lg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {MOCK_PROPERTIES.slice(0, 6).map((p, i) => (
              <PropertyCard key={p.id} property={p} priority={i < 2} />
            ))}
          </div>

          {/* Edge-case: single photo — no slider UI should appear */}
          <div className="mt-8">
            <p className="text-xs text-gray-400 mb-3">
              Single-photo card — arrows and dots must NOT appear:
            </p>
            <div className="max-w-sm">
              <PropertyCard
                property={makeMockProperty({
                  id: 'demo-single',
                  titulo: 'Imóvel com 1 foto (sem slider)',
                  fotos: [MOCK_PHOTOS[0]],
                })}
              />
            </div>
          </div>

          {/* Edge-case: no photos — falls back to placeholder */}
          <div className="mt-8">
            <p className="text-xs text-gray-400 mb-3">
              Zero-photo card — falls back to placeholder:
            </p>
            <div className="max-w-sm">
              <PropertyCard
                property={makeMockProperty({
                  id: 'demo-nophoto',
                  titulo: 'Imóvel sem fotos (placeholder)',
                  fotos: [],
                })}
              />
            </div>
          </div>
        </section>

        {/* ─── 8. PropertyCardSkeleton shimmer (Phase 2) ───────────── */}
        <section>
          <SectionLabel>8. PropertyCardSkeleton — shimmer (Phase 2)</SectionLabel>
          <p className="text-xs text-gray-400 mb-4">
            Cream → white → cream sweep at 110°. Controlled by{' '}
            <code className="bg-gray-100 px-1 rounded">.skeleton-shimmer</code> +{' '}
            <code className="bg-gray-100 px-1 rounded">@keyframes shimmer</code> in globals.css.
            prefers-reduced-motion collapses animation-duration to 0.01ms.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* ─── 9. HeroSection (Phase 3) ────────────────────────────── */}
        <section>
          <SectionLabel>9. HeroSection (Phase 3)</SectionLabel>
          <p className="text-xs text-gray-400 mb-2">
            AnimatedChip ghost eyebrow · grain SVG overlay · CSS scroll-driven parallax
            (BG image requires a real URL — shows gradient fallback here) ·
            cmdk autocomplete with recent-searches (localStorage) ·
            Framer layoutId tab pill.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Check: click tabs → pill morphs smoothly; focus location input → dropdown opens;
            type &quot;boa&quot; → filters to Boa Viagem; select item → populates input;
            revisit after selecting → item appears under &quot;Buscas recentes&quot;.
          </p>
        </section>

        {/* Hero rendered full-bleed outside the constrained max-w-5xl wrapper */}
      </div>

      {/* Full-bleed hero smoke test */}
      <div className="mt-8">
        <p className="max-w-5xl mx-auto px-6 text-xs text-gray-400 mb-2">
          Full-bleed render (gradient fallback — no bgImage passed):
        </p>
        <HeroSection
          title="Encontre o imóvel"
          highlight="dos seus sonhos"
          subtitle="Smoke test — Phase 3. Eyebrow chip, grain overlay, cmdk autocomplete, layoutId tabs."
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-16 mt-8">
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
