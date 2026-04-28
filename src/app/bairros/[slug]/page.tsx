import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin } from 'lucide-react'
import { getNeighborhoodGuide, getNeighborhoodGuides } from '@/lib/site-config'
import { fetchProperties } from '@/lib/properties'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const guides = await getNeighborhoodGuides()
  return guides.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = await getNeighborhoodGuide(slug)
  if (!guide) {
    return { title: 'Guia de Bairro | Morejá' }
  }
  const url = `${SITE_URL}/bairros/${slug}`
  return {
    title:
      guide.meta_title ?? `Imóveis em ${guide.name} | Guia do bairro — Morejá`,
    description:
      guide.meta_description ??
      guide.intro?.slice(0, 160) ??
      `Conheça o bairro ${guide.name} e veja imóveis disponíveis para compra e locação.`,
    alternates: { canonical: url },
    openGraph: {
      title: guide.name,
      description: guide.meta_description ?? guide.intro ?? undefined,
      url,
      images: guide.hero_image ? [{ url: guide.hero_image }] : undefined,
    },
  }
}

export default async function BairroPage({ params }: PageProps) {
  const { slug } = await params
  const guide = await getNeighborhoodGuide(slug)

  if (!guide) notFound()

  // Pega imóveis do bairro (ambas finalidades)
  const [vendas, locacoes] = await Promise.all([
    fetchProperties({ bairro: guide.name, finalidade: 'Venda', limit: 6 }).catch(() => null),
    fetchProperties({ bairro: guide.name, finalidade: 'Locação', limit: 6 }).catch(() => null),
  ])
  const vendasItems = vendas?.data ?? []
  const vendasTotal = vendas?.total ?? 0
  const locacoesItems = locacoes?.data ?? []
  const locacoesTotal = locacoes?.total ?? 0

  const breadcrumbs = [
    { name: 'Início', url: SITE_URL },
    { name: 'Bairros', url: `${SITE_URL}/bairros` },
    { name: guide.name, url: `${SITE_URL}/bairros/${slug}` },
  ]

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />

      {/* Hero do bairro */}
      <section className="relative overflow-hidden bg-[#010744] text-white">
        {guide.hero_image && (
          <Image
            src={guide.hero_image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#010744]/80 to-[#010744]" />
        <div className="relative container-page py-16 sm:py-24 lg:py-32">
          <div className="mb-3 flex items-center gap-2 text-sm text-[#f2d22e]/80">
            <Link href="/" className="hover:text-[#f2d22e]">
              Início
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/bairros" className="hover:text-[#f2d22e]">
              Bairros
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#f2d22e]">{guide.name}</span>
          </div>
          <span className="inline-block text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#f2d22e] mb-3">
            Guia do bairro
          </span>
          <h1 className="heading-display max-w-4xl">{guide.name}</h1>
          {guide.intro && (
            <p className="lead text-gray-200 mt-5 max-w-2xl">{guide.intro}</p>
          )}
        </div>
      </section>

      {/* Highlights (preço m², walk score, etc) */}
      {Array.isArray(guide.highlights) && guide.highlights.length > 0 && (
        <section className="border-b border-gray-100 bg-white">
          <div className="container-page py-10 sm:py-14">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {guide.highlights.map((h, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 bg-[#ededd1]/30 p-5 sm:p-6"
                >
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500">
                    {h.label}
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#010744]">
                    {h.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Imóveis para comprar */}
      {vendasItems.length > 0 && (
        <section className="section bg-white">
          <div className="container-page">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="heading-h2 text-[#010744] mb-1">
                  Imóveis para comprar em {guide.name}
                </h2>
                <p className="text-gray-500">
                  {vendasTotal} {vendasTotal === 1 ? 'opção disponível' : 'opções disponíveis'}
                </p>
              </div>
              <Link
                href={`/comprar?bairro=${encodeURIComponent(guide.name)}`}
                className="hidden sm:inline-flex items-center gap-2 text-[#010744] font-semibold hover:text-[#f2d22e] group"
              >
                Ver todos
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {vendasItems.map((p, i) => (
                <PropertyCard key={p.id} property={p} priority={i < 3} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Imóveis para alugar */}
      {locacoesItems.length > 0 && (
        <section className="section bg-[#ededd1]/30">
          <div className="container-page">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="heading-h2 text-[#010744] mb-1">
                  Imóveis para alugar em {guide.name}
                </h2>
                <p className="text-gray-500">
                  {locacoesTotal} {locacoesTotal === 1 ? 'opção disponível' : 'opções disponíveis'}
                </p>
              </div>
              <Link
                href={`/alugar?bairro=${encodeURIComponent(guide.name)}`}
                className="hidden sm:inline-flex items-center gap-2 text-[#010744] font-semibold hover:text-[#f2d22e] group"
              >
                Ver todos
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {locacoesItems.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="section bg-[#010744] text-white text-center">
        <div className="container-page max-w-2xl">
          <h2 className="heading-h2 text-white mb-4">
            Quer morar ou investir em {guide.name}?
          </h2>
          <p className="lead text-gray-300 mb-8">
            Nossos corretores conhecem o bairro de ponta a ponta. Tire dúvidas e
            agende uma visita.
          </p>
          <Link
            href={`/contato?bairro=${encodeURIComponent(guide.name)}`}
            className="inline-flex items-center justify-center min-h-[52px] gap-2 rounded-xl bg-[#f2d22e] px-8
                       font-bold text-[#010744] shadow-lg transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <MapPin size={18} />
            Falar com corretor
          </Link>
        </div>
      </section>
    </>
  )
}
