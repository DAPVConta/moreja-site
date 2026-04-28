import Link from 'next/link'
import Image from 'next/image'
import { Calculator, Check, ArrowRight } from 'lucide-react'

interface PropertyValuationCTAProps {
  title?: string
  subtitle?: string
  benefits?: string[]
  ctaLabel?: string
  ctaHref?: string
  imageUrl?: string
}

/**
 * RE/MAX-inspired: "Avalie seu imóvel" CTA na home.
 * Foco em CAPTURAR LEAD DO PROPRIETÁRIO (lado da oferta) — diferencial vs
 * portais de lançamentos (que só falam com comprador).
 *
 * Layout 2-col desktop: mockup à esquerda, pitch + lista à direita + CTA.
 * Mobile: stack vertical, mockup escondido.
 */
export function PropertyValuationCTA({
  title = 'Quanto vale seu imóvel?',
  subtitle = 'Receba uma avaliação gratuita feita pelos nossos corretores especialistas em sua região. Sem compromisso.',
  benefits = [
    'Avaliação baseada em vendas reais da região',
    'Análise de localização e características do imóvel',
    'Estratégia de venda personalizada',
    'Resposta em até 24h úteis',
  ],
  ctaLabel = 'Avaliar meu imóvel grátis',
  ctaHref = '/avaliar',
  imageUrl,
}: PropertyValuationCTAProps) {
  return (
    <section className="section bg-[#ededd1]/40">
      <div className="container-page">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-center rounded-3xl overflow-hidden">
          {/* Imagem (mobile: escondida) */}
          <div className="hidden lg:block relative aspect-[4/5] rounded-2xl overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#010744] via-[#1a1f6e] to-[#010744]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#f2d22e] text-[#010744]">
                    <Calculator size={48} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="px-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#010744] px-3 py-1
                             text-xs font-bold uppercase tracking-widest text-[#f2d22e] mb-4">
              <Calculator size={14} aria-hidden="true" />
              Para proprietários
            </span>

            <h2 className="heading-h2 text-[#010744] mb-3">{title}</h2>
            <p className="lead mb-6 max-w-xl">{subtitle}</p>

            <ul className="space-y-3 mb-8 max-w-md">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#010744]">
                    <Check size={14} className="text-[#f2d22e]" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="text-sm text-gray-700 leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>

            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 min-h-[52px] rounded-xl bg-[#f2d22e] px-8
                         font-bold text-[#010744] shadow-lg transition-all
                         hover:brightness-105 hover:shadow-xl active:scale-[0.98]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2"
            >
              {ctaLabel}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <p className="mt-3 text-xs text-gray-500">
              Sem cadastro complicado. 4 perguntas e nosso corretor entra em contato.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
