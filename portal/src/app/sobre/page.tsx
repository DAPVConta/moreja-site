import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Mail, Award, Users, Home, TrendingUp } from 'lucide-react'
import { getBrokers, getTestimonials } from '@/lib/site-config'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'

export const metadata: Metadata = {
  title: 'Sobre a Morejá Imobiliária | Quem Somos',
  description:
    'Conheça a Morejá Imobiliária. Nossa história, valores, equipe de corretores e compromisso com os clientes. Especialistas em imóveis residenciais e comerciais.',
  alternates: { canonical: '/sobre' },
  openGraph: {
    title: 'Sobre a Morejá Imobiliária',
    description: 'Nossa história, equipe e compromisso com você.',
    url: `${SITE_URL}/sobre`,
  },
}

const DIFERENCIAIS = [
  {
    icon: Award,
    titulo: 'Experiência comprovada',
    descricao: 'Anos de atuação no mercado imobiliário regional, com centenas de famílias atendidas.',
  },
  {
    icon: Users,
    titulo: 'Equipe especializada',
    descricao: 'Corretores certificados pelo CRECI, prontos para orientar cada etapa da sua jornada.',
  },
  {
    icon: Home,
    titulo: 'Portfólio exclusivo',
    descricao: 'Amplo catálogo de imóveis residenciais e comerciais para venda e locação.',
  },
  {
    icon: TrendingUp,
    titulo: 'Avaliação de mercado',
    descricao: 'Análise precisa do valor do seu imóvel com base em dados reais do mercado local.',
  },
]

export default async function SobrePage() {
  const [brokers, testimonials] = await Promise.all([getBrokers(), getTestimonials()])

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Início', url: SITE_URL },
          { name: 'Sobre', url: `${SITE_URL}/sobre` },
        ]}
      />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="bg-[#010744] py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Realizando sonhos há anos
            </h1>
            <p className="text-blue-200 text-xl max-w-2xl mx-auto leading-relaxed">
              A Morejá Imobiliária nasceu com um propósito claro: conectar pessoas ao imóvel
              perfeito, com transparência, agilidade e cuidado em cada detalhe.
            </p>
          </div>
        </section>

        {/* Nossa história */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div>
                <span className="inline-block bg-[#f2d22e] text-[#010744] text-sm font-bold px-3 py-1 rounded mb-4">
                  NOSSA HISTÓRIA
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Uma empresa construída sobre confiança
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Fundada com a missão de transformar a experiência imobiliária, a Morejá
                    Imobiliária se consolidou como referência no mercado local, unindo tecnologia
                    de ponta com o atendimento humano e personalizado que nossos clientes merecem.
                  </p>
                  <p>
                    Nossa equipe de corretores credenciados ao CRECI atua com ética, dedicação
                    e profundo conhecimento do mercado regional, garantindo as melhores condições
                    em cada negociação.
                  </p>
                  <p>
                    Seja para comprar, vender ou alugar, a Morejá está ao seu lado em cada passo,
                    do primeiro contato até a entrega das chaves.
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/comprar"
                    className="inline-block bg-[#010744] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0a1a6e] transition-colors"
                  >
                    Ver imóveis
                  </Link>
                  <Link
                    href="/contato"
                    className="inline-block border-2 border-[#010744] text-[#010744] px-6 py-3 rounded-lg font-semibold hover:bg-[#010744] hover:text-white transition-colors"
                  >
                    Fale conosco
                  </Link>
                </div>
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
                  alt="Equipe Morejá Imobiliária"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#010744]/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white font-semibold text-lg">Morejá Imobiliária</p>
                  <div className="flex items-center gap-1.5 text-blue-200 text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    Referência no mercado regional
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Por que escolher a Morejá?</h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Nosso compromisso vai além da venda: construímos relacionamentos duradouros
                baseados em confiança e resultados.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {DIFERENCIAIS.map(({ icon: Icon, titulo, descricao }) => (
                <div
                  key={titulo}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center"
                >
                  <div className="w-14 h-14 bg-[#010744]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-[#010744]" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{titulo}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Equipe */}
        {brokers.length > 0 && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-14">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossa equipe</h2>
                <p className="text-gray-600">
                  Corretores certificados e apaixonados pelo que fazem
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {brokers.map((broker) => (
                  <div
                    key={broker.id}
                    className="text-center bg-gray-50 rounded-xl p-6 border border-gray-100"
                  >
                    {broker.photo_url ? (
                      <Image
                        src={broker.photo_url}
                        alt={broker.name}
                        width={80}
                        height={80}
                        className="rounded-full object-cover mx-auto mb-4"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#010744] flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                        {broker.name[0]}
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900">{broker.name}</h3>
                    {broker.creci && (
                      <p className="text-xs text-gray-500 mt-1">CRECI: {broker.creci}</p>
                    )}
                    {broker.specialties && broker.specialties[0] && (
                      <p className="text-xs text-[#010744] font-medium mt-1">{broker.specialties[0]}</p>
                    )}
                    {broker.whatsapp && (
                      <a
                        href={`https://wa.me/55${broker.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-xs text-green-600 font-medium hover:underline"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Depoimentos */}
        {testimonials.length > 0 && (
          <section className="py-20 bg-[#010744]">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-white text-center mb-14">
                O que dizem nossos clientes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {testimonials.slice(0, 3).map((t) => (
                  <div key={t.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                        <span key={i} className="text-[#f2d22e] text-lg">★</span>
                      ))}
                    </div>
                    <p className="text-blue-100 text-sm leading-relaxed mb-4 italic">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f2d22e] flex items-center justify-center text-[#010744] font-bold text-sm">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{t.name}</p>
                        {t.role && <p className="text-blue-300 text-xs">{t.role}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-20 bg-[#ededd1]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-[#010744] mb-4">
              Pronto para encontrar seu imóvel ideal?
            </h2>
            <p className="text-gray-700 mb-8 max-w-xl mx-auto">
              Nossa equipe está pronta para te ajudar. Entre em contato e descubra as melhores
              oportunidades do mercado.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/comprar"
                className="bg-[#010744] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0a1a6e] transition-colors"
              >
                Buscar imóveis
              </Link>
              <Link
                href="/contato"
                className="bg-white text-[#010744] border-2 border-[#010744] px-8 py-3 rounded-lg font-semibold hover:bg-[#010744] hover:text-white transition-colors"
              >
                Falar com um corretor
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#010744]" />
                {process.env.NEXT_PUBLIC_PHONE ?? '(XX) XXXX-XXXX'}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#010744]" />
                {process.env.NEXT_PUBLIC_EMAIL ?? 'contato@moreja.com.br'}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#010744]" />
                {process.env.NEXT_PUBLIC_ADDRESS ?? 'Endereço da Morejá'}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
