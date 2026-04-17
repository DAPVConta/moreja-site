import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { ContactForm } from '@/components/contact/ContactForm'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

export const metadata: Metadata = {
  title: 'Contato | Morejá Imobiliária',
  description:
    'Entre em contato com a Morejá Imobiliária. Telefone, WhatsApp, e-mail e formulário online. Atendimento personalizado para compra, venda e locação de imóveis.',
  alternates: { canonical: '/contato' },
  openGraph: {
    title: 'Contato | Morejá Imobiliária',
    description: 'Fale com a Morejá. Estamos prontos para te atender.',
    url: `${SITE_URL}/contato`,
  },
}

const HORARIOS = [
  { dia: 'Segunda a Sexta', hora: '8h às 18h' },
  { dia: 'Sábado', hora: '8h às 12h' },
  { dia: 'Domingo', hora: 'Fechado' },
]

export default function ContatoPage() {
  const phone = process.env.NEXT_PUBLIC_PHONE ?? ''
  const email = process.env.NEXT_PUBLIC_EMAIL ?? 'contato@moreja.com.br'
  const address = process.env.NEXT_PUBLIC_ADDRESS ?? ''
  const whatsapp = phone.replace(/\D/g, '')

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Início', url: SITE_URL },
          { name: 'Contato', url: `${SITE_URL}/contato` },
        ]}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#010744] py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Entre em contato</h1>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">
              Nossa equipe está pronta para te atender e encontrar o imóvel ideal para você.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações de contato</h2>

                <div className="space-y-5">
                  {phone && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#010744]/10 rounded-xl flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6 text-[#010744]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Telefone</p>
                        <a href={`tel:${phone}`} className="text-gray-600 hover:text-[#010744] transition-colors">
                          {phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {whatsapp && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                        <MessageCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">WhatsApp</p>
                        <a
                          href={`https://wa.me/55${whatsapp}?text=${encodeURIComponent('Olá! Gostaria de mais informações sobre imóveis.')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline font-medium"
                        >
                          Iniciar conversa →
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#010744]/10 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-[#010744]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">E-mail</p>
                      <a href={`mailto:${email}`} className="text-gray-600 hover:text-[#010744] transition-colors">
                        {email}
                      </a>
                    </div>
                  </div>

                  {address && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#010744]/10 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-[#010744]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Endereço</p>
                        <p className="text-gray-600">{address}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#010744]/10 rounded-xl flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-[#010744]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Horário de atendimento</p>
                      {HORARIOS.map(({ dia, hora }) => (
                        <div key={dia} className="flex justify-between gap-4 text-sm text-gray-600">
                          <span>{dia}:</span>
                          <span className="font-medium">{hora}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="bg-gray-200 rounded-xl h-48 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Mapa disponível em breve</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Envie uma mensagem</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
