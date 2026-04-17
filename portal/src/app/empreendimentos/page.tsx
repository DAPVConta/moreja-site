import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight } from 'lucide-react'
import { fetchEmpreendimentos, formatPrice } from '@/lib/properties'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { PropertyCardSkeleton } from '@/components/properties/PropertyCard'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

export const metadata: Metadata = {
  title: 'Empreendimentos | Morejá Imobiliária',
  description:
    'Conheça os lançamentos e empreendimentos imobiliários exclusivos da Morejá. Apartamentos e casas novos com as melhores condições.',
  alternates: { canonical: '/empreendimentos' },
  openGraph: {
    title: 'Empreendimentos | Morejá Imobiliária',
    description: 'Lançamentos e empreendimentos exclusivos com as melhores condições.',
    url: `${SITE_URL}/empreendimentos`,
  },
}

async function EmpreendimentosList({ q }: { q?: string }) {
  const result = await fetchEmpreendimentos({ q, limit: 12 })

  if (result.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-5xl mb-4">🏗️</p>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Nenhum empreendimento encontrado
        </h2>
        <p className="text-gray-500">Novos lançamentos em breve. Entre em contato para saber mais.</p>
        <Link
          href="/contato"
          className="mt-4 inline-flex items-center gap-2 bg-[#010744] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0a1a6e] transition-colors"
        >
          Fale conosco
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {result.data.map((emp) => (
        <Link
          key={emp.id}
          href={`/empreendimentos/${emp.id}`}
          className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            {emp.fotos[0] ? (
              <Image
                src={emp.fotos[0]}
                alt={emp.titulo}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#010744] to-[#0a1a6e] flex items-center justify-center">
                <span className="text-white/30 text-6xl">🏗️</span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className="bg-[#f2d22e] text-[#010744] text-xs font-bold px-2 py-1 rounded">
                LANÇAMENTO
              </span>
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-[#010744] transition-colors">
              {emp.titulo}
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              {emp.bairro}, {emp.cidade}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{emp.descricao}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">A partir de</p>
                <p className="font-bold text-[#010744]">{formatPrice(emp.preco)}</p>
              </div>
              <span className="text-sm text-[#010744] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function EmpreendimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Início', url: SITE_URL },
          { name: 'Empreendimentos', url: `${SITE_URL}/empreendimentos` },
        ]}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#010744] py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Empreendimentos</h1>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">
              Lançamentos e projetos exclusivos com as melhores condições do mercado
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <EmpreendimentosListWrapper searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </>
  )
}

async function EmpreendimentosListWrapper({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  return <EmpreendimentosList q={params.q} />
}
