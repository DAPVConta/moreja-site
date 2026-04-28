import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'

interface ValuePropositionProps {
  eyebrow?: string
  title?: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
}

const perks = [
  'Atendimento próximo em cada etapa',
  'Tecnologia e transparência',
  'Equipe especializada em cada bairro',
  'Da busca à escritura',
]

export function ValueProposition({
  eyebrow = 'Sobre a Morejá',
  title = 'Conte com a experiência de quem conhece cada bairro',
  body = 'Atuamos com imóveis residenciais e comerciais, oferecendo assessoria completa — da busca à escritura. Transparência, tecnologia e atendimento próximo em cada etapa.',
  ctaLabel = 'Conheça a Morejá',
  ctaHref = '/sobre',
}: ValuePropositionProps) {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: image */}
          <Reveal className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#010744]/60 via-transparent to-transparent" />
            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 bg-white rounded-xl p-4 shadow-lg flex items-center gap-3 max-w-[240px]">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f2d22e]">
                <CheckCircle2 className="w-5 h-5 text-[#010744]" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-[#010744] leading-tight">
                98% de clientes <br /> satisfeitos
              </p>
            </div>
          </Reveal>

          {/* Right: content */}
          <Reveal delay={120}>
            {eyebrow && (
              <span className="inline-block text-xs font-bold tracking-widest uppercase text-[#f2d22e] mb-3">
                {eyebrow}
              </span>
            )}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#010744] leading-tight mb-5">
              {title}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">{body}</p>

            <ul className="grid sm:grid-cols-2 gap-3 mb-8">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-[#010744] shrink-0" aria-hidden="true" />
                  {perk}
                </li>
              ))}
            </ul>

            {ctaLabel && ctaHref && (
              <Link
                href={ctaHref}
                className="btn-primary text-base"
              >
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
