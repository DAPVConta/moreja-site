import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { fetchFeaturedProperties } from '@/lib/properties'

// ISR: revalidate da home a cada 5min — cobre updates em featured properties,
// banners, testimonials, sections sem rebuild do app.
export const revalidate = 300
import {
  getSiteStats,
  getTestimonials,
  getHomeSections,
  getBanners,
  getBrokers,
  getRecentPosts,
} from '@/lib/site-config'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProperties } from '@/components/home/FeaturedProperties'
import { CategoryCards } from '@/components/home/CategoryCards'
import { StatsSection } from '@/components/home/StatsSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { TrustStats } from '@/components/home/TrustStats'
import { ValueProposition } from '@/components/home/ValueProposition'
import { ResidentialFeatured } from '@/components/home/ResidentialFeatured'
import { CommercialFeatured } from '@/components/home/CommercialFeatured'
import { FeaturedCities } from '@/components/home/FeaturedCities'
import { LaunchesPreview } from '@/components/home/LaunchesPreview'
import { LaunchesWaitlist } from '@/components/home/LaunchesWaitlist'
import { BannersSection } from '@/components/home/BannersSection'
import { TeamSection } from '@/components/home/TeamSection'
import { PropertyValuationCTA } from '@/components/home/PropertyValuationCTA'
import { BlogPreview } from '@/components/home/BlogPreview'
import { CoverageMap } from '@/components/home/CoverageMap'
import { RecentlyViewedSection } from '@/components/home/RecentlyViewedSection'
import { FaqAccordion } from '@/components/home/FaqAccordion'

function CtaAnunciarSection() {
  return (
    <section className="section bg-[#ededd1]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#010744] mb-4">
          Quer vender ou alugar seu imóvel?
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Conte com a Morejá para encontrar o melhor negócio. Nossa equipe de
          corretores está pronta para ajudar você.
        </p>
        <Link
          href="/contato"
          className="btn-primary inline-flex items-center gap-2 text-lg"
        >
          Anunciar meu imóvel
          <ArrowRight size={20} />
        </Link>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const [
    featuredProperties,
    stats,
    testimonials,
    sections,
    homeBanners,
    brokers,
    recentPosts,
  ] = await Promise.all([
    fetchFeaturedProperties(),
    getSiteStats(),
    getTestimonials(),
    getHomeSections(),
    getBanners('home'),
    getBrokers(),
    getRecentPosts(3),
  ])

  // Helper: extrai config jsonb de cada seção (caso cadastrada no admin)
  const cfg = (type: string) =>
    (sections.find((s) => s.section_type === type)?.config ?? {}) as Record<string, unknown>

  // Mapa section_type -> componente renderizável
  const sectionMap: Record<string, () => React.ReactNode> = {
    hero_search: () => {
      const c = cfg('hero_search') as {
        title?: string; highlight?: string; subtitle?: string
        bg_image?: string; bg_focal_x?: number; bg_focal_y?: number
        overlay_opacity?: number
      }
      return (
        <HeroSection
          title={c.title}
          highlight={c.highlight}
          subtitle={c.subtitle}
          bgImage={c.bg_image}
          bgFocalX={c.bg_focal_x}
          bgFocalY={c.bg_focal_y}
          overlayOpacity={c.overlay_opacity}
        />
      )
    },
    featured_properties: () => <FeaturedProperties properties={featuredProperties} />,
    category_cards: () => {
      const c = cfg('category_cards') as {
        title?: string; subtitle?: string
        cards?: { title: string; description: string; href: string; bg: string }[]
      }
      return <CategoryCards title={c.title} subtitle={c.subtitle} cards={c.cards} />
    },
    stats: () => <StatsSection stats={stats} />,
    testimonials: () => <TestimonialsSection testimonials={testimonials} />,
    cta_anunciar: () => <CtaAnunciarSection />,
    trust_stats: () => {
      const c = cfg('trust_stats') as { title?: string; items?: { value: string; label: string }[] }
      return <TrustStats title={c.title} items={c.items} />
    },
    value_proposition: () => {
      const c = cfg('value_proposition') as {
        eyebrow?: string; title?: string; body?: string; cta_label?: string; cta_href?: string
      }
      return (
        <ValueProposition
          eyebrow={c.eyebrow}
          title={c.title}
          body={c.body}
          ctaLabel={c.cta_label}
          ctaHref={c.cta_href}
        />
      )
    },
    residential_featured: () => {
      const c = cfg('residential_featured') as { title?: string; subtitle?: string; href_all?: string }
      return (
        <ResidentialFeatured
          properties={featuredProperties}
          title={c.title}
          subtitle={c.subtitle}
          hrefAll={c.href_all}
        />
      )
    },
    commercial_featured: () => {
      const c = cfg('commercial_featured') as { title?: string; subtitle?: string; href_all?: string }
      return (
        <CommercialFeatured
          properties={featuredProperties}
          title={c.title}
          subtitle={c.subtitle}
          hrefAll={c.href_all}
        />
      )
    },
    featured_cities: () => {
      const c = cfg('featured_cities') as {
        title?: string; subtitle?: string
        cities?: { name: string; slug: string; count?: string; image?: string }[]
      }
      return <FeaturedCities title={c.title} subtitle={c.subtitle} cities={c.cities} />
    },
    banners: () => {
      const c = cfg('banners') as { autoplay?: boolean; interval_seconds?: number }
      return (
        <BannersSection
          banners={homeBanners}
          autoplay={c.autoplay ?? true}
          intervalSeconds={c.interval_seconds ?? 5}
        />
      )
    },
    launches_preview: () => {
      const c = cfg('launches_preview') as {
        title?: string; subtitle?: string; href_all?: string
        launches?: {
          id: string; name: string; developer?: string; location: string
          status: string; delivery?: string; priceFrom?: string
          image: string; href?: string
        }[]
      }
      return (
        <LaunchesPreview
          title={c.title}
          subtitle={c.subtitle}
          hrefAll={c.href_all}
          launches={c.launches}
        />
      )
    },
    launches_waitlist: () => {
      const c = cfg('launches_waitlist') as {
        eyebrow?: string; title?: string; subtitle?: string
        lancamento_id?: string | null; benefits?: string[]
      }
      return (
        <LaunchesWaitlist
          eyebrow={c.eyebrow}
          title={c.title}
          subtitle={c.subtitle}
          lancamentoId={c.lancamento_id ?? null}
          benefits={c.benefits}
        />
      )
    },
    team: () => {
      const c = cfg('team') as {
        title?: string; subtitle?: string; cta_label?: string; cta_href?: string; limit?: number
      }
      return (
        <TeamSection
          brokers={brokers}
          title={c.title}
          subtitle={c.subtitle}
          ctaLabel={c.cta_label}
          ctaHref={c.cta_href}
          limit={c.limit}
        />
      )
    },
    valuation_cta: () => {
      const c = cfg('valuation_cta') as {
        title?: string; subtitle?: string; benefits?: string[]
        cta_label?: string; cta_href?: string; image_url?: string
      }
      return (
        <PropertyValuationCTA
          title={c.title}
          subtitle={c.subtitle}
          benefits={c.benefits}
          ctaLabel={c.cta_label}
          ctaHref={c.cta_href}
          imageUrl={c.image_url}
        />
      )
    },
    blog_preview: () => {
      const c = cfg('blog_preview') as {
        title?: string; subtitle?: string; cta_label?: string; cta_href?: string
      }
      return (
        <BlogPreview
          posts={recentPosts}
          title={c.title}
          subtitle={c.subtitle}
          ctaLabel={c.cta_label}
          ctaHref={c.cta_href}
        />
      )
    },
    coverage_map: () => {
      const c = cfg('coverage_map') as {
        title?: string; subtitle?: string; city_label?: string; cta_href?: string
        regions?: { name: string; slug: string; count?: number; highlight?: boolean }[]
      }
      return (
        <CoverageMap
          title={c.title}
          subtitle={c.subtitle}
          cityLabel={c.city_label}
          ctaHref={c.cta_href}
          regions={c.regions ?? []}
        />
      )
    },
    recently_viewed: () => {
      const c = cfg('recently_viewed') as { title?: string; subtitle?: string }
      return <RecentlyViewedSection title={c.title} subtitle={c.subtitle} />
    },
    faq: () => {
      const c = cfg('faq') as {
        title?: string; subtitle?: string
        items?: { question: string; answer: string }[]
      }
      return <FaqAccordion title={c.title} subtitle={c.subtitle} items={c.items} />
    },
  }

  // Fallback: se a tabela estiver vazia, renderiza a ordem canônica da home
  const ordered = sections.length > 0
    ? sections
    : [
        { id: '1',  section_type: 'hero_search',          label: '', position:  0, active: true, config: {} },
        { id: '2',  section_type: 'banners',               label: '', position:  1, active: true, config: {} },
        { id: '3',  section_type: 'featured_properties',  label: '', position:  2, active: true, config: {} },
        { id: '4',  section_type: 'category_cards',        label: '', position:  3, active: true, config: {} },
        { id: '5',  section_type: 'stats',                 label: '', position:  4, active: true, config: {} },
        { id: '6',  section_type: 'testimonials',          label: '', position:  5, active: true, config: {} },
        { id: '7',  section_type: 'cta_anunciar',          label: '', position:  6, active: true, config: {} },
        { id: '8',  section_type: 'trust_stats',           label: '', position:  7, active: true, config: {} },
        { id: '9',  section_type: 'value_proposition',     label: '', position:  8, active: true, config: {} },
        { id: '10', section_type: 'residential_featured',  label: '', position:  9, active: true, config: {} },
        { id: '11', section_type: 'commercial_featured',   label: '', position: 10, active: true, config: {} },
        { id: '12', section_type: 'coverage_map',          label: '', position: 11, active: true, config: {} },
        { id: '13', section_type: 'launches_preview',      label: '', position: 12, active: true, config: {} },
      ]

  return (
    <>
      {ordered.map((s) => {
        const render = sectionMap[s.section_type]
        if (!render) return null
        return <div key={s.id}>{render()}</div>
      })}
    </>
  )
}
