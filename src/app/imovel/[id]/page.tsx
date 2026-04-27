import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Bed, Bath, Car, Maximize2, Phone, MessageCircle, Share2, ChevronLeft } from 'lucide-react'
import { fetchProperty, fetchProperties, formatPrice, formatArea } from '@/lib/properties'
import { sanitizeHtml, looksLikeHtml } from '@/lib/sanitize-html'
import { BreadcrumbJsonLd, PropertyJsonLd } from '@/components/seo/JsonLd'
import { PropertyGallery } from '@/components/properties/PropertyGallery'
import { PropertyMap } from '@/components/properties/PropertyMap'
import { LeadFormInline } from '@/components/properties/LeadFormInline'
import { SaveButton } from '@/components/properties/SaveButton'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const property = await fetchProperty(id)

  if (!property) {
    return { title: 'Imóvel não encontrado | Morejá Imobiliária' }
  }

  const title = `${property.titulo} - ${property.bairro}, ${property.cidade} | Morejá`
  // Strip HTML para meta description (texto puro)
  const description = property.descricao.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
  const image = property.fotos[0]
  const url = `${SITE_URL}/imovel/${id}`

  return {
    title,
    description,
    alternates: { canonical: `/imovel/${id}` },
    openGraph: {
      title,
      description,
      url,
      images: image ? [{ url: image, width: 1200, height: 630, alt: property.titulo }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export async function generateStaticParams() {
  const result = await fetchProperties({ limit: 100 })
  return result.data.map((p) => ({ id: p.id }))
}

export default async function ImovelPage({ params }: PageProps) {
  const { id } = await params
  const property = await fetchProperty(id)

  if (!property) notFound()

  const finalidadeLabel =
    property.finalidade === 'Venda' ? 'Comprar' : 'Alugar'
  const finalidadePath =
    property.finalidade === 'Venda' ? '/comprar' : '/alugar'

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Início', url: SITE_URL },
          { name: finalidadeLabel, url: `${SITE_URL}${finalidadePath}` },
          { name: property.titulo, url: `${SITE_URL}/imovel/${id}` },
        ]}
      />
      <PropertyJsonLd property={property} url={`${SITE_URL}/imovel/${id}`} />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
              <Link href="/" className="hover:text-[#010744] shrink-0">Início</Link>
              <span className="shrink-0">/</span>
              <Link href={finalidadePath} className="hover:text-[#010744] shrink-0">{finalidadeLabel}</Link>
              <span className="shrink-0">/</span>
              <span className="text-gray-800 truncate min-w-0">{property.titulo}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Back */}
          <Link
            href={finalidadePath}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#010744] mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar à listagem
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left: Gallery + Details */}
            <div className="lg:col-span-2 space-y-5 sm:space-y-6">
              {/* Gallery */}
              <PropertyGallery fotos={property.fotos} titulo={property.titulo} />

              {/* Title & Price */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    {property.destaque && (
                      <span className="inline-block bg-[#f2d22e] text-[#010744] text-xs font-bold px-2 py-1 rounded mb-2">
                        DESTAQUE
                      </span>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{property.titulo}</h1>
                    <div className="flex items-start gap-1.5 text-gray-500 mt-1 text-sm sm:text-base">
                      <MapPin className="w-4 h-4 text-[#010744] mt-0.5 shrink-0" />
                      <span>{property.bairro}, {property.cidade} – {property.estado}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Ref.: {property.codigo}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-2xl sm:text-3xl font-bold text-[#010744]">
                      {formatPrice(property.preco)}
                      {property.finalidade === 'Locação' && (
                        <span className="text-sm font-normal text-gray-400">/mês</span>
                      )}
                    </p>
                    {property.preco_condominio && (
                      <p className="text-sm text-gray-500">
                        Cond: {formatPrice(property.preco_condominio)}/mês
                      </p>
                    )}
                    {property.preco_iptu && (
                      <p className="text-sm text-gray-500">
                        IPTU: {formatPrice(property.preco_iptu)}/ano
                      </p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-100">
                  {property.area_util ? (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Maximize2 className="w-5 h-5 text-[#010744]" />
                      <div>
                        <p className="text-sm font-semibold">{formatArea(property.area_util)}</p>
                        <p className="text-xs text-gray-400">Área útil</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Maximize2 className="w-5 h-5 text-[#010744]" />
                      <div>
                        <p className="text-sm font-semibold">{formatArea(property.area_total)}</p>
                        <p className="text-xs text-gray-400">Área total</p>
                      </div>
                    </div>
                  )}
                  {property.quartos > 0 && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Bed className="w-5 h-5 text-[#010744]" />
                      <div>
                        <p className="text-sm font-semibold">{property.quartos}</p>
                        <p className="text-xs text-gray-400">
                          {property.suites ? `(${property.suites} suítes)` : 'Quartos'}
                        </p>
                      </div>
                    </div>
                  )}
                  {property.banheiros > 0 && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Bath className="w-5 h-5 text-[#010744]" />
                      <div>
                        <p className="text-sm font-semibold">{property.banheiros}</p>
                        <p className="text-xs text-gray-400">Banheiros</p>
                      </div>
                    </div>
                  )}
                  {property.vagas != null && property.vagas > 0 && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Car className="w-5 h-5 text-[#010744]" />
                      <div>
                        <p className="text-sm font-semibold">{property.vagas}</p>
                        <p className="text-xs text-gray-400">Vagas</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Descrição</h2>
                {looksLikeHtml(property.descricao) ? (
                  <div
                    className="prose-property text-gray-700 leading-relaxed text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(property.descricao) }}
                  />
                ) : (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                    {property.descricao}
                  </div>
                )}
              </div>

              {/* Location */}
              {(property.endereco || (property.latitude && property.longitude)) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Localização</h2>
                  {property.endereco && (
                    <div className="flex items-start gap-2 text-gray-700 text-sm mb-4">
                      <MapPin className="w-4 h-4 text-[#010744] mt-0.5 shrink-0" />
                      <span>
                        {property.endereco}
                        {property.numero && `, ${property.numero}`}
                        {property.complemento && ` – ${property.complemento}`}
                        {` – ${property.bairro}, ${property.cidade} – ${property.estado}`}
                        {property.cep && ` – CEP ${property.cep}`}
                      </span>
                    </div>
                  )}
                  <PropertyMap
                    lat={property.latitude}
                    lng={property.longitude}
                    address={[property.endereco, property.numero, property.bairro, property.cidade, property.estado]
                      .filter(Boolean)
                      .join(', ')}
                  />
                </div>
              )}

              {/* Tour virtual */}
              {property.tour_virtual && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Tour Virtual</h2>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={property.tour_virtual}
                      className="w-full h-full"
                      allowFullScreen
                      loading="lazy"
                      title={`Tour virtual – ${property.titulo}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Contact Card */}
            <aside className="space-y-4 pb-20 lg:pb-0">
              {/* Sticky on desktop only */}
              <div className="lg:sticky lg:top-24">
                {/* Share */}
                <ShareButton titulo={property.titulo} />

                {/* Broker card */}
                {property.corretor_nome && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
                    <div className="flex items-center gap-3">
                      {property.corretor_foto ? (
                        <Image
                          src={property.corretor_foto}
                          alt={property.corretor_nome}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#010744] flex items-center justify-center text-white font-bold text-lg">
                          {property.corretor_nome[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{property.corretor_nome}</p>
                        {property.corretor_creci && (
                          <p className="text-xs text-gray-500">CRECI: {property.corretor_creci}</p>
                        )}
                      </div>
                    </div>
                    {property.corretor_whatsapp && (
                      <a
                        href={`https://wa.me/55${property.corretor_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi o imóvel "${property.titulo}" (ref. ${property.codigo}) no site e tenho interesse.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>
                    )}
                    <a
                      href={`tel:${process.env.NEXT_PUBLIC_PHONE ?? ''}`}
                      className="mt-2 w-full flex items-center justify-center gap-2 border border-[#010744] text-[#010744] py-2.5 rounded-lg font-medium text-sm hover:bg-[#010744] hover:text-white transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Ligar
                    </a>
                  </div>
                )}

                {/* Lead Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Tenho interesse neste imóvel</h3>
                  <LeadFormInline
                    imovelId={property.id}
                    imovelCodigo={property.codigo}
                    imovelTitulo={property.titulo}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile sticky action bar — pedaço 6.4
            3 botões: Salvar (toggle), WhatsApp, Ligar.
            Padding-bottom respeita safe-area-inset-bottom no iOS. */}
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-3 py-2.5 flex gap-2"
          style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
        >
          <SaveButton propertyId={property.id} />
          {property.corretor_whatsapp && (
            <a
              href={`https://wa.me/55${property.corretor_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel "${property.titulo}" (ref. ${property.codigo}).`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 active:bg-green-600 text-white h-12 rounded-lg font-semibold text-sm transition-colors active:scale-[0.98]"
              aria-label="Contatar por WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
          )}
          <a
            href={`tel:${process.env.NEXT_PUBLIC_PHONE ?? ''}`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#010744] text-white h-12 rounded-lg font-semibold text-sm transition-colors active:scale-[0.98] active:bg-[#000533]"
            aria-label="Ligar para a corretora"
          >
            <Phone className="w-5 h-5" />
            Ligar
          </a>
        </div>
      </div>
    </>
  )
}

// Client component for share button
import { ShareButtonClient } from '@/components/properties/ShareButtonClient'

function ShareButton({ titulo }: { titulo: string }) {
  return <ShareButtonClient titulo={titulo} />
}
