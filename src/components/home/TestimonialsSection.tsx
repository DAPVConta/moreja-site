import { Star } from 'lucide-react'
import type { Testimonial } from '@/types/site'

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

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

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  if (testimonials.length === 0) return null

  return (
    <section className="section bg-[#010744]">
      <div className="container-page">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="heading-h2 text-white mb-2">
            O que nossos clientes dizem
          </h2>
          <p className="lead text-gray-300">
            A satisfação dos nossos clientes é nossa maior conquista
          </p>
        </div>

        {/* Mobile: carrossel snap-x; desktop: grid 2/3 cols.
            Scroll-padding alinha o card ao container-page. */}
        <div
          className="
            -mx-4 sm:-mx-6 px-4 sm:px-6
            flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6
            overflow-x-auto md:overflow-visible
            snap-x snap-mandatory md:snap-none
            scroll-smooth scrollbar-thin
            pb-4 md:pb-0
          "
        >
          {testimonials.slice(0, 6).map((t) => (
            <article
              key={t.id}
              className="
                snap-center md:snap-align-none
                shrink-0 md:shrink
                w-[85%] sm:w-[60%] md:w-auto
                bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl
                p-6 flex flex-col gap-4
                hover:border-white/20 transition-colors
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
                    className="w-10 h-10 rounded-full bg-[#f2d22e] flex items-center justify-center text-[#010744] font-bold text-sm"
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
          ))}
        </div>
      </div>
    </section>
  )
}
