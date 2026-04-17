import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ChevronLeft, Phone, MessageCircle } from 'lucide-react'
import { fetchProperty, fetchEmpreendimentos, formatPrice } from '@/lib/properties'
import { BreadcrumbJsonLd, PropertyJsonLd } from '@/components/seo/JsonLd'
import { PropertyGallery } from '@/components/properties/PropertyGallery'
import { LeadFormInline } from '@/components/properties/LeadFormInline'
import { ShareButtonClient } from '@/components/properties/ShareButtonClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const property = await fetchProperty(id)
  if (!property) return { title: 'Empreendimento não encontrado | Morejá' }

  const title = `${property.titulo} | Empreendimento Morejá`
  const description = property.descricao.slice(0, 160)
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
  const property = await fetchProperty(id)
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

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#010744]">Início</Link>
              <span>/</span>
              <Link href="/empreendimentos" className="hover:text-[#010744]">Empreendimentos</Link>
              <span>/</span>
              <span className="text-gray-800 truncate max-w-xs">{property.titulo}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <PropertyGallery fotos={property.fotos} titulo={property.titulo} />

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.titulo}</h1>
                <div className="flex items-center gap-1.5 text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 text-[#010744]" />
                  <span>{property.bairro}, {property.cidade} – {property.estado}</span>
                </div>
                <div className="text-3xl font-bold text-[#010744] mb-6">
                  A partir de {formatPrice(property.preco)}
                </div>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                  {property.descricao}
                </div>
              </div>

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

            <aside>
              <div className="sticky top-24 space-y-4">
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
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
