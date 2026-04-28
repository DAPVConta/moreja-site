import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin } from 'lucide-react'
import { getNeighborhoodGuides } from '@/lib/site-config'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

export const metadata: Metadata = {
  title: 'Guia de Bairros | Morejá Imobiliária',
  description:
    'Conheça os melhores bairros para morar e investir. Veja características, infraestrutura e imóveis disponíveis em cada região.',
  alternates: { canonical: '/bairros' },
}

export default async function BairrosIndexPage() {
  const guides = await getNeighborhoodGuides()

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Início', url: SITE_URL },
          { name: 'Bairros', url: `${SITE_URL}/bairros` },
        ]}
      />

      <section className="bg-[#010744] text-white">
        <div className="container-page py-14 sm:py-20 lg:py-24">
          <span className="inline-block text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#f2d22e] mb-3">
            Guia de Bairros
          </span>
          <h1 className="heading-display max-w-3xl mb-4">
            Conheça os bairros que atendemos
          </h1>
          <p className="lead text-gray-200 max-w-2xl">
            Características, infraestrutura, escolas próximas e oportunidades
            disponíveis em cada região.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-page">
          {guides.length === 0 ? (
            <p className="text-center text-gray-500 py-16">
              Em breve, guias completos para cada bairro que atendemos.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((g) => (
                <Link
                  key={g.id}
                  href={`/bairros/${g.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm
                             transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#010744]">
                    {g.hero_image && (
                      <Image
                        src={g.hero_image}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#010744] via-[#010744]/60 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <div className="flex items-center gap-1.5 mb-1 text-[#f2d22e]">
                        <MapPin size={14} aria-hidden="true" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Bairro
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold">{g.name}</h2>
                    </div>
                  </div>
                  <div className="p-5">
                    {g.intro && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                        {g.intro}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#010744]
                                     transition-all group-hover:gap-3 group-hover:text-[#f2d22e]">
                      Ver guia completo
                      <ArrowRight size={14} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
