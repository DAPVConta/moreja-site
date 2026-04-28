import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PropertyGrid } from '@/components/properties/PropertyGrid'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { buildRouteMetadata } from '@/lib/site-config'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const params = await searchParams
  const meta = await buildRouteMetadata('/alugar', {
    title: 'Alugar Imóveis | Morejá Imobiliária',
    description:
      'Encontre apartamentos, casas e imóveis comerciais para alugar. Locação residencial e comercial com as melhores condições.',
  })

  const hasFilters = Object.keys(params).some(
    (k) => !['utm_source', 'utm_medium', 'utm_campaign', 'source'].includes(k)
  )

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.canonical },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: meta.title,
      description: meta.ogDescription,
      url: meta.canonical,
      images: meta.ogImage ? [{ url: meta.ogImage }] : undefined,
    },
  }
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

export default function AlugarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Início', url: SITE_URL },
          { name: 'Alugar', url: `${SITE_URL}/alugar` },
        ]}
      />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 animate-pulse" />}>
        <PropertyGrid searchParams={searchParams} finalidade="Locação" title="Imóveis para Alugar" />
      </Suspense>
    </>
  )
}
