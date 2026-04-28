import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Phone, Mail, Award } from 'lucide-react'
import type { Broker } from '@/types/site'

interface TeamSectionProps {
  brokers: Broker[]
  title?: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
  /** Quantos brokers mostrar no grid (default 6, resto via "Ver toda equipe"). */
  limit?: number
}

/**
 * "Encontre um Corretor" — pattern RE/MAX. Diferencial-chave vs portais
 * de luxo (Compass/Sotheby's) e de lançamentos (maxlancamentos): a rede
 * humana é exibida como produto. Cada broker recebe foto, CRECI,
 * especialidade e botão WhatsApp direto para mensagem pré-preenchida.
 *
 * Mobile: snap-x carousel; desktop: grid 3-col.
 */
export function TeamSection({
  brokers,
  title = 'Encontre um corretor',
  subtitle = 'Nossa equipe conhece cada bairro e está pronta para te ajudar a encontrar o lar ideal.',
  ctaLabel = 'Ver toda a equipe',
  ctaHref = '/sobre#equipe',
  limit = 6,
}: TeamSectionProps) {
  if (brokers.length === 0) return null

  const visible = brokers.slice(0, limit)

  return (
    <section id="equipe" className="section bg-white">
      <div className="container-page">
        <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#f2d22e] mb-3">
              Equipe Morejá
            </span>
            <h2 className="heading-h2 text-[#010744] mb-2">{title}</h2>
            <p className="lead">{subtitle}</p>
          </div>
        </div>

        {/* Mobile: snap carousel; desktop: grid 3-col */}
        <div
          className="
            -mx-4 sm:mx-0 px-4 sm:px-0
            flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6
            overflow-x-auto sm:overflow-visible
            snap-x snap-mandatory sm:snap-none
            scroll-smooth scrollbar-thin
            pb-4 sm:pb-0
          "
        >
          {visible.map((broker) => (
            <BrokerCard key={broker.id} broker={broker} />
          ))}
        </div>

        {brokers.length > limit && (
          <div className="mt-8 text-center">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center min-h-[48px] gap-2 rounded-xl
                         border-2 border-[#010744] px-6 font-semibold text-[#010744]
                         transition-all hover:bg-[#010744] hover:text-white"
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function BrokerCard({ broker }: { broker: Broker }) {
  const whatsappDigits = broker.whatsapp?.replace(/\D/g, '') ?? ''
  const message = `Olá ${broker.name}! Vim pelo site da Morejá e gostaria de conversar.`
  const wppHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits.startsWith('55') ? whatsappDigits : '55' + whatsappDigits}?text=${encodeURIComponent(message)}`
    : null

  return (
    <article className="snap-center shrink-0 sm:shrink w-[85%] sm:w-auto">
      <div
        className="overflow-hidden rounded-2xl bg-[#ededd1]/40 transition-all
                   hover:-translate-y-1 hover:shadow-lg group"
      >
        {/* Photo */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#010744]">
          {broker.photo_url ? (
            <Image
              src={broker.photo_url}
              alt={broker.name}
              fill
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl font-extrabold text-[#f2d22e]/40">
              {broker.name[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-[#010744] leading-tight">
            {broker.name}
          </h3>

          {broker.creci && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <Award size={12} className="text-[#f2d22e]" aria-hidden="true" />
              CRECI {broker.creci}
            </p>
          )}

          {broker.specialties && broker.specialties.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {broker.specialties.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#010744]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="mt-5 flex flex-col gap-2">
            {wppHref && (
              <a
                href={wppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-lg
                           bg-emerald-500 px-4 text-sm font-semibold text-white
                           transition-colors hover:bg-emerald-600 active:bg-emerald-700"
              >
                <MessageCircle size={16} aria-hidden="true" />
                WhatsApp
              </a>
            )}
            <div className="flex gap-2">
              {broker.phone && (
                <a
                  href={`tel:${broker.phone.replace(/\D/g, '')}`}
                  aria-label={`Ligar para ${broker.name}`}
                  className="flex flex-1 items-center justify-center gap-2 min-h-[44px] rounded-lg
                             border border-[#010744]/20 px-3 text-sm text-[#010744]
                             transition-colors hover:border-[#010744] hover:bg-[#010744] hover:text-white"
                >
                  <Phone size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">Ligar</span>
                </a>
              )}
              {broker.email && (
                <a
                  href={`mailto:${broker.email}`}
                  aria-label={`E-mail de ${broker.name}`}
                  className="flex flex-1 items-center justify-center gap-2 min-h-[44px] rounded-lg
                             border border-[#010744]/20 px-3 text-sm text-[#010744]
                             transition-colors hover:border-[#010744] hover:bg-[#010744] hover:text-white"
                >
                  <Mail size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">E-mail</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
