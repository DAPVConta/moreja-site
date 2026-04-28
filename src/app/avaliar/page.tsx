import type { Metadata } from 'next'
import { Calculator, Clock, Shield, TrendingUp } from 'lucide-react'
import { ValuationWizard } from '@/components/properties/ValuationWizard'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { buildRouteMetadata } from '@/lib/site-config'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

export async function generateMetadata(): Promise<Metadata> {
  const meta = await buildRouteMetadata('/avaliar', {
    title: 'Avalie seu imóvel grátis | Morejá Imobiliária',
    description:
      'Receba uma avaliação gratuita do seu imóvel feita por corretores especialistas. Sem compromisso, resposta em até 24h.',
  })
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.canonical },
    openGraph: {
      title: meta.title,
      description: meta.ogDescription,
      url: meta.canonical,
      images: meta.ogImage ? [{ url: meta.ogImage }] : undefined,
    },
  }
}

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Baseado em vendas reais',
    text: 'Cruzamos seu imóvel com transações recentes da região para um valor de mercado preciso.',
  },
  {
    icon: Shield,
    title: 'Sem compromisso',
    text: 'Avaliação 100% gratuita. Você decide se quer prosseguir com a venda ou apenas conhecer o valor.',
  },
  {
    icon: Clock,
    title: 'Resposta em 24h',
    text: 'Nosso corretor especialista no seu bairro analisa e retorna em até um dia útil.',
  },
]

export default function AvaliarPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Início', url: SITE_URL },
          { name: 'Avaliar imóvel', url: `${SITE_URL}/avaliar` },
        ]}
      />

      {/* Hero pequeno + wizard começa imediatamente */}
      <section className="bg-[#010744] text-white">
        <div className="container-page py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f2d22e] px-3 py-1
                             text-xs font-bold uppercase tracking-widest text-[#010744] mb-4">
              <Calculator size={14} aria-hidden="true" />
              Para proprietários
            </span>
            <h1 className="heading-display text-white mb-3">
              Quanto vale seu imóvel?
            </h1>
            <p className="lead text-gray-200 max-w-xl">
              Receba uma avaliação gratuita feita pelos nossos corretores
              especialistas. Sem compromisso, sem pressão.
            </p>
          </div>
        </div>
      </section>

      {/* Wizard + benefits side-by-side em desktop */}
      <section className="section bg-[#ededd1]/30">
        <div className="container-page">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-14">
            {/* Benefits */}
            <aside className="lg:sticky lg:top-24 self-start">
              <h2 className="heading-h3 text-[#010744] mb-6">
                Como funciona a avaliação Morejá
              </h2>
              <ul className="space-y-5">
                {BENEFITS.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#010744] text-[#f2d22e]">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-bold text-[#010744]">{title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mt-1">
                        {text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Wizard form */}
            <div className="rounded-2xl bg-white shadow-xl shadow-[#010744]/5 p-6 sm:p-8 lg:p-10">
              <ValuationWizard />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
