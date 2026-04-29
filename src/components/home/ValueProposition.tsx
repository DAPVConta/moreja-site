'use client'

/**
 * ValueProposition — refactor solicitado pelo cliente
 *
 * Estrutura de DUAS sub-seções horizontais empilhadas:
 *
 * 1) Imagem (esquerda) + intro narrativa (direita)
 *    - Image com single trust badge (Reclame Aqui RA1000 Ótimo) no canto
 *      inferior esquerdo — antes eram 3 badges empilhadas, simplificado a 1.
 *    - Direita: AnimatedChip eyebrow + h2 + body, seguido de mini-bloco
 *      "Nossa diferença" com h3 + body.
 *
 * 2) Perks 2×2 (esquerda) + compromisso + CTA (direita)
 *    - Esquerda: 4 perks em grid 2×2 (Lucide icon + título + descrição).
 *    - Direita: eyebrow yellow + h3 + body + CTA yellow.
 *
 * Mobile (<lg): cada sub-seção vira coluna única, imagem/perks em cima.
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

// ─── Perks ────────────────────────────────────────────────────────────────────

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

function PerkCard({ perk }: { perk: Perk }) {
  const Icon = perk.icon
  return (
    <div
      className="rounded-xl bg-white border border-[#010744]/[0.08] shadow-sm
                 p-4 sm:p-5 flex gap-3 items-start
                 hover:border-[#f2d22e]/60 hover:shadow-md
                 transition-all duration-200"
    >
      <div
        className="shrink-0 w-9 h-9 rounded-lg bg-[#f2d22e]/15
                   flex items-center justify-center"
      >
        <Icon size={18} className="text-[#010744]" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#010744] leading-tight mb-1">
          {perk.title}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">{perk.description}</p>
      </div>
    </div>
  )
}

// ─── Single trust badge (substitui o stack de 3) ─────────────────────────────

function ReclameAquiBadge() {
  return (
    <div
      className="absolute bottom-5 left-5 bg-white rounded-2xl shadow-xl px-3.5 py-2.5
                 flex items-center gap-2.5"
      aria-label="Selo Reclame Aqui RA1000 Ótimo"
    >
      <div className="shrink-0 w-9 h-9 rounded-full bg-[#f2d22e]/20 flex items-center justify-center">
        <Award size={18} className="text-[#f2d22e]" aria-hidden="true" />
      </div>
      <div className="leading-tight">
        <p className="text-[10px] font-bold text-[#010744]">Reclame Aqui</p>
        <p className="text-[10px] font-semibold text-[#010744]/70">RA1000</p>
        <p className="text-[11px] font-extrabold text-[#010744]">Ótimo</p>
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function ValueProposition({
  eyebrow = 'Sobre a Morejá',
  ctaLabel = 'Conheça a Morejá',
  ctaHref = '/sobre',
}: ValuePropositionProps) {
  return (
    <section className="section bg-white overflow-hidden">
      <div className="container-page space-y-16 lg:space-y-24">

        {/* ─── Sub-seção A: imagem + intro narrativa ─────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 lg:items-center">
          {/* Esquerda: imagem com selo único Reclame Aqui */}
          <Reveal>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80"
                alt="Equipe Morejá Imobiliária em atendimento"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <ReclameAquiBadge />
            </div>
          </Reveal>

          {/* Direita: eyebrow chip + h2 + body + sub-bloco "Nossa diferença" */}
          <Reveal delay={80} className="flex flex-col gap-8">
            <div>
              <AnimatedChip icon={Users} variant="gold" className="mb-4">
                {eyebrow}
              </AnimatedChip>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#010744] leading-tight mb-4 text-balance">
                Conte com a experiência de quem conhece cada bairro
              </h2>
              <p className="text-base text-gray-600 leading-relaxed">
                Atuamos com imóveis residenciais e comerciais, oferecendo
                assessoria completa — da busca à escritura. Transparência,
                tecnologia e atendimento próximo em cada etapa.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f2d22e] mb-2">
                Nossa diferença
              </p>
              <h3 className="text-xl md:text-2xl font-bold text-[#010744] leading-snug mb-3 text-balance">
                Tecnologia para simplificar, pessoas para cuidar
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Combinamos ferramentas digitais com uma equipe de
                especialistas locais para que você encontre o imóvel certo
                no tempo certo, sem burocracia desnecessária.
              </p>
            </div>
          </Reveal>
        </div>

        {/* ─── Sub-seção B: perks 2×2 + compromisso + CTA ────────────────── */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 lg:items-center">
          {/* Esquerda: perks 2×2 */}
          <Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {perks.map((perk) => (
                <PerkCard key={perk.title} perk={perk} />
              ))}
            </div>
          </Reveal>

          {/* Direita: eyebrow yellow + h3 + body + CTA */}
          <Reveal delay={80}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f2d22e] mb-2">
              Nosso compromisso
            </p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#010744] leading-tight mb-4 text-balance">
              Do primeiro contato ao último registro
            </h3>
            <p className="text-base text-gray-600 leading-relaxed mb-6">
              Estamos presentes em cada fase: da avaliação do imóvel ao
              financiamento, passando pela negociação e chegando à
              assinatura. Uma jornada completa, sem surpresas.
            </p>
            {ctaLabel && ctaHref && (
              <Link href={ctaHref} className="btn-primary inline-flex items-center gap-2 text-base">
                {ctaLabel}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            )}
          </Reveal>
        </div>

      </div>
    </section>
  )
}
