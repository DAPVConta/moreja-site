import Link from 'next/link'
import { fetchProperties } from '@/lib/properties'
import { PROPERTY_TYPES, PRICE_RANGES_VENDA, PRICE_RANGES_LOCACAO } from '@/types/property'
import { PropertyCard, PropertyCardSkeleton } from './PropertyCard'
import { PropertyFiltersClient } from './PropertyFiltersClient'
import { Suspense } from 'react'

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

interface PropertyGridProps {
  searchParams: Promise<SearchParams>
  finalidade: 'Venda' | 'Locação'
  title: string
}

async function PropertyResults({
  searchParams,
  finalidade,
}: {
  searchParams: SearchParams
  finalidade: 'Venda' | 'Locação'
}) {
  const page = Number(searchParams.page ?? 1)
  const priceRanges = finalidade === 'Venda' ? PRICE_RANGES_VENDA : PRICE_RANGES_LOCACAO

  const result = await fetchProperties({
    finalidade,
    tipo: searchParams.tipo,
    bairro: searchParams.bairro,
    cidade: searchParams.cidade,
    preco_min: searchParams.preco_min ? Number(searchParams.preco_min) : undefined,
    preco_max: searchParams.preco_max ? Number(searchParams.preco_max) : undefined,
    quartos: searchParams.quartos ? Number(searchParams.quartos) : undefined,
    q: searchParams.q,
    order:
      (searchParams.order as 'preco_asc' | 'preco_desc' | 'data_desc' | 'relevancia') ??
      'relevancia',
    page,
    limit: 12,
  })

  if (result.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-5xl mb-4">🏠</p>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum imóvel encontrado</h2>
        <p className="text-gray-500">Tente ajustar os filtros para ver mais resultados.</p>
      </div>
    )
  }

  const totalPages = result.pages

  return (
    <>
      <p className="text-sm text-gray-500 mb-6">
        {result.total.toLocaleString('pt-BR')} imóvel{result.total !== 1 ? 'is' : ''} encontrado
        {result.total !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {result.data.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav
          className="flex justify-center items-center flex-wrap gap-2 mt-10 sm:mt-12"
          aria-label="Paginação de imóveis"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <PaginationLink
              key={p}
              page={p}
              currentPage={page}
              searchParams={searchParams}
              priceRanges={priceRanges}
            />
          ))}
        </nav>
      )}
    </>
  )
}

function PaginationLink({
  page,
  currentPage,
  searchParams,
}: {
  page: number
  currentPage: number
  searchParams: SearchParams
  priceRanges: typeof PRICE_RANGES_VENDA | typeof PRICE_RANGES_LOCACAO
}) {
  const params = new URLSearchParams()
  if (searchParams.q) params.set('q', searchParams.q)
  if (searchParams.tipo) params.set('tipo', searchParams.tipo)
  if (searchParams.bairro) params.set('bairro', searchParams.bairro)
  if (searchParams.cidade) params.set('cidade', searchParams.cidade)
  if (searchParams.preco_min) params.set('preco_min', searchParams.preco_min)
  if (searchParams.preco_max) params.set('preco_max', searchParams.preco_max)
  if (searchParams.quartos) params.set('quartos', searchParams.quartos)
  if (searchParams.order) params.set('order', searchParams.order)
  params.set('page', String(page))

  const isActive = page === currentPage

  return (
    <Link
      href={`?${params.toString()}`}
      scroll
      className={`min-w-11 h-11 px-3 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[#010744] text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
      aria-label={`Página ${page}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {page}
    </Link>
  )
}

export async function PropertyGrid({ searchParams, finalidade, title }: PropertyGridProps) {
  const params = await searchParams
  const priceRanges = finalidade === 'Venda' ? PRICE_RANGES_VENDA : PRICE_RANGES_LOCACAO

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#010744] py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{title}</h1>
          <p className="text-blue-200 text-sm sm:text-base">
            {finalidade === 'Venda'
              ? 'Encontre o imóvel ideal para comprar'
              : 'Encontre o imóvel ideal para alugar'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 shrink-0">
            <PropertyFiltersClient
              initialParams={params}
              finalidade={finalidade}
              propertyTypes={[...PROPERTY_TYPES]}
              priceRanges={priceRanges.map((r) => ({ ...r }))}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Sort Bar */}
            <div className="flex items-center justify-end mb-5 sm:mb-6">
              <OrderSelect currentOrder={params.order} currentParams={params} />
            </div>

            <Suspense
              fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <PropertyResults searchParams={params} finalidade={finalidade} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}

function OrderSelect({
  currentOrder,
  currentParams,
}: {
  currentOrder?: string
  currentParams: SearchParams
}) {
  const options = [
    { value: 'relevancia', label: 'Mais relevantes' },
    { value: 'preco_asc', label: 'Menor preço' },
    { value: 'preco_desc', label: 'Maior preço' },
    { value: 'data_desc', label: 'Mais recentes' },
  ]

  const buildUrl = (order: string) => {
    const p = new URLSearchParams()
    if (currentParams.q) p.set('q', currentParams.q)
    if (currentParams.tipo) p.set('tipo', currentParams.tipo)
    if (currentParams.bairro) p.set('bairro', currentParams.bairro)
    if (currentParams.cidade) p.set('cidade', currentParams.cidade)
    if (currentParams.preco_min) p.set('preco_min', currentParams.preco_min)
    if (currentParams.preco_max) p.set('preco_max', currentParams.preco_max)
    if (currentParams.quartos) p.set('quartos', currentParams.quartos)
    p.set('order', order)
    p.set('page', '1')
    return `?${p.toString()}`
  }

  const active = currentOrder ?? 'relevancia'

  return (
    <div className="w-full sm:w-auto">
      {/* Mobile: native select for easy tap */}
      <label className="sm:hidden flex items-center gap-2 text-sm text-gray-600">
        <span className="whitespace-nowrap">Ordenar:</span>
        <select
          value={active}
          onChange={(e) => {
            if (typeof window !== 'undefined') {
              window.location.href = buildUrl(e.target.value)
            }
          }}
          className="flex-1 min-w-0 px-3 py-2.5 text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744]"
          aria-label="Ordenar imóveis"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>

      {/* Desktop: pill buttons */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-sm text-gray-600 whitespace-nowrap">Ordenar por:</span>
        <div className="flex gap-1 flex-wrap">
          {options.map((opt) => (
            <Link
              key={opt.value}
              href={buildUrl(opt.value)}
              scroll={false}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                active === opt.value
                  ? 'bg-[#010744] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
