import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ChevronLeft, Phone, MessageCircle } from 'lucide-react'
import { fetchEmpreendimento, fetchEmpreendimentos, formatPrice } from '@/lib/properties'
import { getSiteConfig } from '@/lib/site-config'
import { sanitizeHtml, looksLikeHtml } from '@/lib/sanitize-html'
import { BreadcrumbJsonLd, PropertyJsonLd } from '@/components/seo/JsonLd'
import { PropertyViewTracker } from '@/components/seo/PropertyViewTracker'
import { RecentlyViewedTracker } from '@/components/properties/RecentlyViewedTracker'
import { PropertyGallery } from '@/components/properties/PropertyGallery'
import { PropertyMap } from '@/components/properties/PropertyMap'
import { LeadFormInline } from '@/components/properties/LeadFormInline'
import { ShareButtonClient } from '@/components/properties/ShareButtonClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const property = await fetchEmpreendimento(id)
  if (!property) return { title: 'Empreendimento não encontrado | Morejá' }

  const title = `${property.titulo} | Empreendimento Morejá`
  const description = property.descricao.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
  const image = property.fotos[0]

  return {
    title,
    description,
    alternates: { canonical: `/empreendimentos/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/empreendimentos/${id}`,
      images: image ? [{ url: image, width: 1200, height: 630, alt: property.titulo }] : [],
    },
  }
}

export async function generateStaticParams() {
  const result = await fetchEmpreendimentos({ limit: 50 })
  return result.data.map((p) => ({ id: p.id }))
}

export default async function EmpreendimentoPage({ params }: PageProps) {
  const { id } = await params
  const [property, siteConfig] = await Promise.all([
    fetchEmpreendimento(id),
    getSiteConfig(),
  ])
  const turnstileSiteKey = siteConfig.turnstile_site_key?.trim() || undefined
  if (!property) notFound()

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Início', url: SITE_URL },
          { name: 'Empreendimentos', url: `${SITE_URL}/empreendimentos` },
          { name: property.titulo, url: `${SITE_URL}/empreendimentos/${id}` },
        ]}
      />
      <PropertyJsonLd property={property} url={`${SITE_URL}/empreendimentos/${id}`} />
      <RecentlyViewedTracker property={property} />
      <PropertyViewTracker
        property={{
          id: property.id,
          titulo: property.titulo,
          preco: property.preco,
          tipo: property.tipo,
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
              <Link href="/" className="hover:text-[#010744] shrink-0">Início</Link>
              <span className="shrink-0">/</span>
              <Link href="/empreendimentos" className="hover:text-[#010744] shrink-0 hidden sm:inline">Empreendimentos</Link>
              <span className="shrink-0 hidden sm:inline">/</span>
              <span className="text-gray-800 truncate min-w-0">{property.titulo}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 sm:py-8">
          <Link
            href="/empreendimentos"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#010744] mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar aos empreendimentos
          </Link>

          {/* LANÇAMENTO badge */}
          <div className="mb-4">
            <span className="inline-block bg-[#f2d22e] text-[#010744] text-sm font-bold px-3 py-1 rounded">
              LANÇAMENTO
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-5 sm:space-y-6">
              <PropertyGallery fotos={property.fotos} titulo={property.titulo} />

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-snug">{property.titulo}</h1>
                <div className="flex items-start gap-1.5 text-gray-500 text-sm sm:text-base mb-4">
                  <MapPin className="w-4 h-4 text-[#010744] mt-0.5 shrink-0" />
                  <span>{property.bairro}, {property.cidade} – {property.estado}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#010744] mb-5 sm:mb-6">
                  A partir de {formatPrice(property.preco)}
                </div>
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

              {(property.endereco || (property.latitude && property.longitude)) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Localização</h2>
                  {property.endereco && (
                    <div className="flex items-start gap-2 text-gray-700 text-sm mb-4">
                      <MapPin className="w-4 h-4 text-[#010744] mt-0.5 shrink-0" />
                      <span>
                        {property.endereco}
                        {property.numero && `, ${property.numero}`}
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

            <aside className="pb-20 lg:pb-0">
              <div className="lg:sticky lg:top-24 space-y-4">
                <ShareButtonClient titulo={property.titulo} />

                {property.corretor_whatsapp && (
                  <a
                    href={`https://wa.me/55${property.corretor_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho interesse no empreendimento "${property.titulo}". Gostaria de mais informações.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                <a
                  href={`tel:${process.env.NEXT_PUBLIC_PHONE ?? ''}`}
                  className="w-full flex items-center justify-center gap-2 border border-[#010744] text-[#010744] py-3 rounded-xl font-semibold text-sm hover:bg-[#010744] hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Ligar
                </a>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Tenho interesse</h3>
                  <LeadFormInline
                    imovelId={property.id}
                    imovelCodigo={property.codigo}
                    imovelTitulo={property.titulo}
                    turnstileSiteKey={turnstileSiteKey}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile sticky action bar */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-3 py-2.5 flex gap-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          {property.corretor_whatsapp && (
            <a
              href={`https://wa.me/55${property.corretor_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho interesse no empreendimento "${property.titulo}". Gostaria de mais informações.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 active:bg-green-600 text-white h-12 rounded-lg font-semibold text-sm"
              aria-label="Contatar por WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
          )}
          <a
            href={`tel:${process.env.NEXT_PUBLIC_PHONE ?? ''}`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#010744] text-white h-12 rounded-lg font-semibold text-sm"
            aria-label="Ligar"
          >
            <Phone className="w-5 h-5" />
            Ligar
          </a>
        </div>
      </div>
    </>
  )
}
