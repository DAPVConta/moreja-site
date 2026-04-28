import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export interface CategoryCard {
  title: string
  description: string
  href: string
  bg: string
}

interface CategoryCardsProps {
  title?: string
  subtitle?: string
  cards?: CategoryCard[]
}

const defaultCards: CategoryCard[] = [
  {
    title: 'Residencial',
    description: 'Apartamentos, casas e condomínios para sua família',
    href: '/comprar?tipo=Apartamento',
    bg: 'https://placehold.co/1200x900/010744/f2d22e?text=Residencial',
  },
  {
    title: 'Comercial',
    description: 'Salas, galpões e espaços para o seu negócio crescer',
    href: '/comprar?tipo=Comercial',
    bg: 'https://placehold.co/800x600/1a1f6e/f2d22e?text=Comercial',
  },
  {
    title: 'Empreendimentos',
    description: 'Lançamentos exclusivos e novos empreendimentos',
    href: '/empreendimentos',
    bg: 'https://placehold.co/800x600/f2d22e/010744?text=Empreendimentos',
  },
]

/** Determina tamanho de imagem `sizes` por posição no bento grid. */
function sizesFor(index: number, total: number): string {
  // Mobile: always full width.
  // Desktop: hero card (index 0) spans 2/3 of max-w-7xl; side cards span 1/3.
  if (index === 0) {
    return '(max-width: 1024px) 100vw, 66vw'
  }
  return '(max-width: 1024px) 100vw, 33vw'
}

export function CategoryCards({
  title = 'O que você procura?',
  subtitle = 'Encontre o imóvel ideal para cada momento da sua vida',
  cards,
}: CategoryCardsProps = {}) {
  const categories = cards && cards.length > 0 ? cards : defaultCards

  // ── Desktop layout breakdown ──────────────────────────────────────────────
  // Grid: 3 cols × 2 rows at lg+
  //   Card 0 (hero): col-span-2, row-span-2  → tall left column, wide aspect
  //   Card 1: col 3, row 1                   → compact right top
  //   Card 2: col 3, row 2                   → compact right bottom
  // Mobile: single column stack — same for all cards.
  // ─────────────────────────────────────────────────────────────────────────

  const heroCard = categories[0]
  const sideCards = categories.slice(1, 3)  // up to 2 side cards
  const extraCards = categories.slice(3)    // 4th+ card: normal grid below

  return (
    <section className="section bg-[#ededd1]">
      <div className="container-page">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>

        {/* ── Bento grid (lg+) / stacked list (< lg) ── */}
        {/* The bento-grid class in globals.css sets explicit row heights only at
            lg+ via a media query — inline style would apply to all breakpoints
            and break the single-column mobile layout. */}
        <div
          className="
            grid grid-cols-1
            lg:grid-cols-3
            gap-4 sm:gap-5 lg:gap-5
            category-bento-grid
          "
        >
          {/* ── Hero card — always first, spans 2×2 on desktop ── */}
          {heroCard && (
            <BentoCard
              card={heroCard}
              className="
                aspect-[4/5] sm:aspect-[3/4]
                lg:aspect-auto lg:col-span-2 lg:row-span-2 lg:h-full
              "
              sizes={sizesFor(0, categories.length)}
              priority
            />
          )}

          {/* ── Side cards — stack vertically in column 3 on desktop ── */}
          {sideCards.map((card, i) => (
            <BentoCard
              key={card.title}
              card={card}
              className="
                aspect-[16/9] sm:aspect-[3/2]
                lg:aspect-auto lg:col-span-1 lg:row-span-1 lg:h-full
              "
              sizes={sizesFor(i + 1, categories.length)}
            />
          ))}
        </div>

        {/* ── Extra cards (4th+) in a normal 3-col grid below ── */}
        {extraCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
            {extraCards.map((card, i) => (
              <BentoCard
                key={card.title}
                card={card}
                className="aspect-[3/4] sm:aspect-[4/5]"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── BentoCard ─────────────────────────────────────────────────────────────────
// Extracted to avoid repetition; receives className for layout-specific
// aspect/span overrides from the parent grid.
// ─────────────────────────────────────────────────────────────────────────────

interface BentoCardProps {
  card: CategoryCard
  className?: string
  sizes: string
  priority?: boolean
}

function BentoCard({ card, className = '', sizes, priority = false }: BentoCardProps) {
  return (
    <Link
      href={card.href}
      className={`
        group relative overflow-hidden rounded-2xl block
        cursor-pointer
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2
        ${className}
      `}
    >
      {/* Background image */}
      <Image
        src={card.bg}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="
          object-cover
          transition-transform duration-700
          group-hover:scale-105
          motion-reduce:transition-none
        "
      />

      {/* Dark gradient overlay — bottom-up */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-t from-[#010744]/90 via-[#010744]/40 to-transparent
          transition-opacity duration-200
          group-hover:from-[#010744]/95
        "
        aria-hidden="true"
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
        <h3 className="text-xl sm:text-2xl font-bold mb-1.5">{card.title}</h3>

        {/* Description: visible on mobile, hidden then revealed on hover (desktop) */}
        <p
          className="
            text-sm text-gray-200 mb-3 sm:mb-4
            opacity-100 md:opacity-0 md:translate-y-2
            md:group-hover:opacity-100 md:group-hover:translate-y-0
            transition-all duration-200
            motion-reduce:opacity-100 motion-reduce:translate-y-0
          "
        >
          {card.description}
        </p>

        <span
          className="
            inline-flex items-center gap-2
            text-[#f2d22e] font-semibold text-sm
          "
        >
          Ver imóveis
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="
              transition-transform duration-150
              group-hover:translate-x-1
              motion-reduce:transition-none
            "
          />
        </span>
      </div>
    </Link>
  )
}
