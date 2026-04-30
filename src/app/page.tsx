import { fetchFeaturedProperties, fetchFeaturedEmpreendimentos } from '@/lib/properties'
import type { Property } from '@/types/property'
import type { Launch } from '@/components/home/LaunchesPreview'

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
import { LocationsMap } from '@/components/home/LocationsMap'
import { RecentlyViewedSection } from '@/components/home/RecentlyViewedSection'
import { FaqAccordion } from '@/components/home/FaqAccordion'
import { CtaAnunciar } from '@/components/home/CtaAnunciar'

function inferLaunchStatus(p: Property): string {
  const stage = (p.estagio_obra ?? '').toLowerCase()
  if (stage.includes('pré') || stage.includes('pre')) return 'Pré-lançamento'
  if (stage.includes('obra')) return 'Em obras'
  if (stage.includes('lançamento') || stage.includes('lancamento')) return 'Lançamento'
  return stage ? p.estagio_obra! : 'Lançamento'
}

function formatDelivery(p: Property): string | undefined {
  if (!p.publicado_em) return undefined
  const year = String(p.publicado_em).slice(0, 4)
  if (!/^\d{4}$/.test(year)) return undefined
  return `Entrega ${year}`
}

function formatPriceFrom(preco: number): string {
  if (!preco || preco <= 0) return 'Sob consulta'
  if (preco >= 1_000_000) {
    const milhoes = (preco / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
    return `A partir de R$ ${milhoes} mi`
  }
  const mil = Math.round(preco / 1_000)
  return `A partir de R$ ${mil} mil`
}

function empreendimentoToLaunch(p: Property): Launch | null {
  const image = Array.isArray(p?.fotos) ? p.fotos[0] : undefined
  if (!image || !p.id || !p.titulo) return null
  const location = [p.bairro, p.cidade, p.estado].filter(Boolean).join(', ')
  return {
    id: p.id,
    name: p.titulo,
    developer: p.construtora_nome,
    location,
    status: inferLaunchStatus(p),
    delivery: formatDelivery(p),
    priceFrom: formatPriceFrom(p.preco),
    image,
    href: `/empreendimentos/${p.id}`,
  }
}

export default async function HomePage() {
  const [
    featuredProperties,
    featuredEmpreendimentos,
    stats,
    testimonials,
    sections,
    homeBanners,
    brokers,
    recentPosts,
  ] = await Promise.all([
    fetchFeaturedProperties(),
    fetchFeaturedEmpreendimentos(),
    getSiteStats(),
    getTestimonials(),
    getHomeSections(),
    getBanners('home'),
    getBrokers(),
    getRecentPosts(3),
  ])

  const supremoLaunches: Launch[] = (() => {
    try {
      return featuredEmpreendimentos
        .map(empreendimentoToLaunch)
        .filter((l): l is Launch => l !== null)
    } catch (err) {
      console.error('[HomePage] erro montando supremoLaunches:', err)
      return []
    }
  })()

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
    cta_anunciar: () => <CtaAnunciar />,
    trust_stats: () => {
      const c = cfg('trust_stats') as { title?: string; items?: { value: string; label: string; year?: string }[] }
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
          intervalSeconds={c.interval_seconds ?? 4}
        />
      )
    },
    launches_preview: () => {
      const c = cfg('launches_preview') as {
        title?: string; subtitle?: string; href_all?: string
        launches?: Launch[]
      }
      // Admin pode curar manualmente via home_sections.config.launches;
      // se não curou, cai p/ empreendimentos com destaque no Supremo.
      const launches = c.launches && c.launches.length > 0 ? c.launches : supremoLaunches
      return (
        <LaunchesPreview
          title={c.title}
          subtitle={c.subtitle}
          hrefAll={c.href_all}
          launches={launches}
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
    locations_map: () => {
      const c = cfg('locations_map') as {
        title?: string; subtitle?: string; city_label?: string; cta_href?: string
        max_points_each_side?: number
      }
      return (
        <LocationsMap
          title={c.title}
          subtitle={c.subtitle}
          cityLabel={c.city_label}
          ctaHref={c.cta_href}
          maxPointsEachSide={c.max_points_each_side}
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

  // home_sections é fonte da verdade. RLS já filtra `active = true` para
  // visitantes anônimos (policy `public_read_active_home_sections` em
  // migration 006), então `sections` já vem só com as ativas.
  // Tabela sempre seedada via migrations 006 + 008 + 025; se vier vazia
  // (instalação nova mal aplicada), home renderiza vazio — isso é um sinal
  // pra reaplicar as migrations, não algo pra mascarar com fallback.
  return (
    <>
      {sections.map((s) => {
        const render = sectionMap[s.section_type]
        if (!render) return null
        return <div key={s.id}>{render()}</div>
      })}
    </>
  )
}
