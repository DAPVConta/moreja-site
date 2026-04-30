'use client'

/**
 * ValueProposition — Phase 10
 *
 * Upgrades over Phase 9:
 *  - Sticky image on desktop (lg:sticky lg:top-24) while narrative text scrolls.
 *    Disabled on mobile — reverts to single-column static layout.
 *  - 3 narrative blocks on the right, each fade-in via Reveal.
 *  - Perks in 2×2 micro-card grid (Lucide icon + title + 1-line description).
 *  - Stacked trust badges (3 seals with slight rotation) replacing single badge.
 *  - AnimatedChip eyebrow.
 *  - prefers-reduced-motion: sticky + reveals still work (CSS handles the
 *    transition collapse via the global @layer base rule in globals.css).
 *  - Mobile (<lg): static single-column, no sticky.
 */

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  ShieldCheck,
  Users,
  MapPin,
  FileCheck,
  Award,
  type LucideIcon,
} from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { AnimatedChip } from '@/components/ui'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ValuePropositionProps {
  eyebrow?: string
  title?: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
}

// ─── Perks data ───────────────────────────────────────────────────────────────

interface Perk {
  icon: LucideIcon
  title: string
  description: string
}

const perks: Perk[] = [
  {
    icon: Users,
    title: 'Atendimento próximo',
    description: 'Cada etapa acompanhada por um consultor dedicado.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparência total',
    description: 'Documentação e histórico do imóvel sem surpresas.',
  },
  {
    icon: MapPin,
    title: 'Especialistas por bairro',
    description: 'Equipe com conhecimento hiperlocal de cada região.',
  },
  {
    icon: FileCheck,
    title: 'Da busca à escritura',
    description: 'Assessoria jurídica e financeira em todo o processo.',
  },
]

// ─── Trust badge ──────────────────────────────────────────────────────────────

function TrustBadge() {
  return (
    <div
      className="absolute bottom-6 left-6 w-[120px] bg-white rounded-xl shadow-xl p-2.5
                 flex flex-col items-center gap-0.5"
      aria-label="Selo Reclame Aqui RA1000"
    >
      <Award size={14} className="text-[#f2d22e]" aria-hidden="true" />
      <span className="text-[9px] font-bold text-[#010744] text-center leading-tight">
        Reclame Aqui
        <br />
        RA1000
      </span>
      <span className="text-[10px] font-extrabold text-[#010744]">Ótimo</span>
    </div>
  )
}

// ─── PerkCard ─────────────────────────────────────────────────────────────────

function PerkCard({ perk }: { perk: Perk }) {
  const Icon = perk.icon
  return (
    <div
      className="rounded-xl bg-[#010744]/[0.03] border border-[#010744]/[0.06]
                 p-4 flex gap-3 items-start
                 hover:bg-[#010744]/[0.06] hover:scale-[1.02]
                 transition-all duration-200 cursor-default"
    >
      <div
        className="shrink-0 w-8 h-8 rounded-lg bg-[#f2d22e]/10
                   flex items-center justify-center"
      >
        <Icon size={16} className="text-[#010744]" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#010744] leading-tight mb-0.5">
          {perk.title}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">{perk.description}</p>
      </div>
    </div>
  )
}

// ─── Narrative blocks ─────────────────────────────────────────────────────────

interface NarrativeBlock {
  label: string
  heading: string
  body: string
}

const narrativeBlocks: NarrativeBlock[] = [
  {
    label: 'Nossa missão',
    heading: 'Conte com a experiência de quem conhece cada bairro',
    body: 'Atuamos com imóveis residenciais e comerciais, oferecendo assessoria completa — da busca à escritura. Transparência, tecnologia e atendimento próximo em cada etapa.',
  },
  {
    label: 'Nossa diferença',
    heading: 'Tecnologia para simplificar, pessoas para cuidar',
    body: 'Combinamos ferramentas digitais com uma equipe de especialistas locais para que você encontre o imóvel certo no tempo certo, sem burocracia desnecessária.',
  },
  {
    label: 'Nosso compromisso',
    heading: 'Do primeiro contato ao último registro',
    body: 'Estamos presentes em cada fase: da avaliação do imóvel ao financiamento, passando pela negociação e chegando à assinatura. Uma jornada completa, sem surpresas.',
  },
]

// ─── Section ──────────────────────────────────────────────────────────────────

export function ValueProposition({
  eyebrow = 'Sobre a Morejá',
  ctaLabel = 'Conheça a Morejá',
  ctaHref = '/sobre',
}: ValuePropositionProps) {
  return (
    <section className="section bg-white overflow-hidden">
      <div className="container-page">
        {/*
         * Desktop layout: 2 columns.
         *   Left  — imagem com selo + grid 2×2 de perks logo abaixo (juntos
         *           sticky, p/ acompanhar a leitura dos 3 blocos da direita).
         *   Right — eyebrow + heading principal + 2 blocos secundários + CTA.
         *
         * Mobile (<lg): single column. Imagem no topo, perks abaixo dela,
         * depois a narrativa. Sticky desligado.
         */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 lg:items-start">

          {/* ── Left: image + perks ────────────────────────────────────────── */}
          <Reveal className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80"
                alt="Equipe Morejá Imobiliária em atendimento"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-tr from-[#010744]/60 via-transparent to-transparent"
              />
              <TrustBadge />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {perks.map((perk) => (
                <PerkCard key={perk.title} perk={perk} />
              ))}
            </div>
          </Reveal>

          {/* ── Right: narrative blocks + CTA ─────────────────────────────── */}
          <div className="flex flex-col gap-10">

            {/* Bloco 1 — eyebrow chip + heading principal + corpo */}
            <Reveal delay={80}>
              <AnimatedChip
                icon={Award}
                variant="gold"
                className="mb-4"
              >
                {eyebrow}
              </AnimatedChip>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#010744] leading-tight mb-4">
                {narrativeBlocks[0].heading}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-prose">
                {narrativeBlocks[0].body}
              </p>
            </Reveal>

            {/* Bloco 2 — eyebrow + sub-heading + corpo */}
            <Reveal delay={120}>
              <span className="eyebrow">{narrativeBlocks[1].label}</span>
              <h3 className="text-xl md:text-2xl font-bold text-[#010744] leading-snug mb-3">
                {narrativeBlocks[1].heading}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed max-w-prose">
                {narrativeBlocks[1].body}
              </p>
            </Reveal>

            {/* Bloco 3 — eyebrow + sub-heading + corpo */}
            <Reveal delay={160}>
              <span className="eyebrow">{narrativeBlocks[2].label}</span>
              <h3 className="text-xl md:text-2xl font-bold text-[#010744] leading-snug mb-3">
                {narrativeBlocks[2].heading}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed max-w-prose">
                {narrativeBlocks[2].body}
              </p>
            </Reveal>

            {/* CTA */}
            {ctaLabel && ctaHref && (
              <Reveal delay={200}>
                <Link href={ctaHref} className="btn-primary text-base self-start">
                  {ctaLabel}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
