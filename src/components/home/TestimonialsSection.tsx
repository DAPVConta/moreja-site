'use client'

/**
 * TestimonialsSection — marquee infinito + conic-gradient border.
 *
 * Desktop (lg+):
 *   - Faixa de cards deslizando continuamente da direita para a esquerda.
 *   - Lista duplicada para loop seamless.
 *   - Pausa ao hover no container.
 *   - prefers-reduced-motion: grid 3 colunas estático.
 *
 * Mobile/tablet (< lg):
 *   - Scroll horizontal snap-x (mesmo comportamento anterior).
 *
 * Conic-gradient border animado:
 *   - Implementado via CSS custom property @property --angle animada.
 *   - Fallback: box-shadow glow amarelo pulsante para browsers sem suporte.
 */

import { Star } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import type { Testimonial } from '@/types/site'

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 'ft-1',
    name: 'Ana Beatriz Melo',
    role: 'Compradora — Boa Viagem',
    text: 'A equipe da Morejá tornou todo o processo de compra muito tranquilo. Encontramos o apartamento ideal em Boa Viagem em menos de três semanas.',
    rating: 5,
    photo_url: null,
    active: true,
    created_at: '',
  },
  {
    id: 'ft-2',
    name: 'Carlos Eduardo Lima',
    role: 'Locador — Graças',
    text: 'Aluguel gerenciado com profissionalismo. Nunca precisei me preocupar com inadimplência ou burocracia. Recomendo a Morejá sem hesitar.',
    rating: 5,
    photo_url: null,
    active: true,
    created_at: '',
  },
  {
    id: 'ft-3',
    name: 'Fernanda Souza',
    role: 'Compradora — Aflitos',
    text: 'Atendimento impecável do início ao fim. O corretor conhecia cada detalhe do bairro e nos ajudou a tomar a melhor decisão.',
    rating: 5,
    photo_url: null,
    active: true,
    created_at: '',
  },
  {
    id: 'ft-4',
    name: 'Ricardo Alves',
    role: 'Vendedor — Casa Forte',
    text: 'Vendi meu imóvel em tempo recorde. A divulgação foi excelente e a equipe cuidou de toda a documentação com muita competência.',
    rating: 5,
    photo_url: null,
    active: true,
    created_at: '',
  },
  {
    id: 'ft-5',
    name: 'Juliana Ferreira',
    role: 'Locatária — Pina',
    text: 'Processo rápido e transparente. A Morejá foi clara em cada etapa da locação e me ajudou a encontrar um apartamento dentro do meu orçamento.',
    rating: 5,
    photo_url: null,
    active: true,
    created_at: '',
  },
  {
    id: 'ft-6',
    name: 'Marcos Henrique Costa',
    role: 'Comprador — Boa Viagem',
    text: 'Qualidade no atendimento que diferencia a Morejá das demais imobiliárias. Sinto que tive um parceiro de verdade nessa jornada.',
    rating: 5,
    photo_url: null,
    active: true,
    created_at: '',
  },
]

// ── StarRating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Avaliação: ${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? 'fill-[#f2d22e] text-[#f2d22e]' : 'text-gray-600'}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

// ── TestimonialCard ─────────────────────────────────────────────────────────

interface CardProps {
  t: Testimonial
  /** When true, wraps in conic-border shell for the animated ring. */
  withConicBorder?: boolean
}

function TestimonialCard({ t, withConicBorder = false }: CardProps) {
  const inner = (
    <article
      className="
        bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl
        p-6 flex flex-col gap-4 h-full
        hover:border-white/20 transition-colors duration-150
      "
    >
      <StarRating rating={t.rating} />
      <blockquote className="text-gray-200 text-sm leading-relaxed flex-1">
        &ldquo;{t.text}&rdquo;
      </blockquote>
      <footer className="flex items-center gap-3">
        {t.photo_url ? (
          <img
            src={t.photo_url}
            alt={t.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full bg-[#f2d22e] flex items-center justify-center text-[#010744] font-bold text-sm shrink-0"
            aria-hidden="true"
          >
            {t.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-white font-semibold text-sm">{t.name}</p>
          {t.role && <p className="text-gray-400 text-xs">{t.role}</p>}
        </div>
      </footer>
    </article>
  )

  if (!withConicBorder) return inner

  // Conic-gradient border shell — uses the .testimonial-conic-shell class
  // defined in globals.css via @property --angle + @keyframes conic-spin.
  // The shell is position:relative, rounded, p-[1.5px], and the ::before
  // pseudo creates the spinning gradient ring behind the glass card.
  return (
    <div className="testimonial-conic-shell rounded-2xl p-[1.5px]">
      {inner}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function TestimonialsSection({ testimonials: testimonialsProp }: TestimonialsSectionProps) {
  const shouldReduceMotion = useReducedMotion()
  const testimonials = testimonialsProp.length > 0 ? testimonialsProp : FALLBACK_TESTIMONIALS
  // Use at most 6 items for the marquee to keep the initial frame lean.
  const items = testimonials.slice(0, 6)

  return (
    <section className="section bg-[#010744] overflow-hidden">
      <div className="container-page">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="heading-h2 text-white mb-2">
            O que nossos clientes dizem
          </h2>
          <p className="lead text-gray-300">
            A satisfação dos nossos clientes é nossa maior conquista
          </p>
        </div>
      </div>

      {/* ── Desktop: marquee infinito (lg+) ── */}
      {/* The marquee bleeds to viewport edges for a cinematic feel while
          the heading above is correctly contained in container-page. */}
      <div className="hidden lg:block">
        {shouldReduceMotion ? (
          // Reduced-motion fallback: static 3-col grid inside container
          <div className="container-page grid grid-cols-3 gap-6">
            {items.map((t) => (
              <TestimonialCard key={t.id} t={t} withConicBorder />
            ))}
          </div>
        ) : (
          <div
            className="testimonials-marquee-track"
            aria-live="off"
            aria-label="Depoimentos de clientes — rolagem automática"
          >
            {/* Original list — visible to screen readers */}
            <div className="testimonials-marquee-inner">
              {items.map((t) => (
                <div key={t.id} className="testimonials-marquee-item">
                  <TestimonialCard t={t} withConicBorder />
                </div>
              ))}
              {/* Duplicate list — hidden from assistive tech, creates seamless loop */}
              {items.map((t) => (
                <div
                  key={`dup-${t.id}`}
                  className="testimonials-marquee-item"
                  aria-hidden="true"
                >
                  <TestimonialCard t={t} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile / tablet (< lg): snap scroll horizontal ── */}
      <div
        className="
          lg:hidden
          -mx-4 sm:-mx-6 px-4 sm:px-6
          flex gap-4 sm:gap-6
          overflow-x-auto
          snap-x snap-mandatory
          scroll-smooth scrollbar-thin
          pb-4
        "
        aria-label="Depoimentos de clientes"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="snap-center shrink-0 w-[85%] sm:w-[60%]"
          >
            <TestimonialCard t={t} />
          </div>
        ))}
      </div>
    </section>
  )
}
