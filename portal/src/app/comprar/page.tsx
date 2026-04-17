import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PropertyGrid } from '@/components/properties/PropertyGrid'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

export const metadata: Metadata = {
  title: 'Comprar Imóveis | Morejá Imobiliária',
  description:
    'Encontre apartamentos, casas, terrenos e imóveis comerciais para comprar. Imóveis residenciais e comerciais com os melhores preços.',
  alternates: { canonical: '/comprar' },
  openGraph: {
    title: 'Imóveis para Comprar | Morejá Imobiliária',
    description: 'Encontre o imóvel ideal para comprar na Morejá Imobiliária.',
    url: `${SITE_URL}/comprar`,
  },
}

interface SearchParams {
  q?: string
  tipo?: string
  bairro?: string
  cidade?: string
  preco_min?: string
  preco_max?: string
  quartos?: string
  order?: string
  page?: string
}

export default function ComprarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Início', url: SITE_URL },
          { name: 'Comprar', url: `${SITE_URL}/comprar` },
        ]}
      />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 animate-pulse" />}>
        <PropertyGrid searchParams={searchParams} finalidade="Venda" title="Imóveis para Comprar" />
      </Suspense>
    </>
  )
}
