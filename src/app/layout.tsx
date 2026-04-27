import type { Metadata, Viewport } from 'next'
import { Raleway } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFab } from '@/components/layout/WhatsAppFab'
import { JsonLd } from '@/components/seo/JsonLd'
import { ThirdPartyScripts, GtmNoScript } from '@/components/seo/ThirdPartyScripts'
import { getSiteConfig } from '@/lib/site-config'

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://moreja.com.br'
const SITE_NAME = 'Morejá Imobiliária'

export async function generateViewport(): Promise<Viewport> {
  const config = await getSiteConfig()
  return {
    themeColor: config.primary_color || '#010744',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  }
}

// generateMetadata reads site_config so title/description are always up-to-date
export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()

  const title = config.meta_title || `${SITE_NAME} | Encontre o imóvel dos seus sonhos`
  const description =
    config.meta_description ||
    'A Morejá Imobiliária oferece os melhores imóveis residenciais e comerciais. Compre, alugue ou invista com segurança e qualidade.'

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    keywords: [
      'imóveis',
      'comprar imóvel',
      'alugar imóvel',
      'imobiliária',
      'Morejá',
      'imóveis à venda',
      'locação de imóveis',
      'apartamentos',
      'casas',
    ],
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'Real Estate',
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: SITE_URL,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: config.og_image || '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} – Imóveis residenciais e comerciais`,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description,
      images: [{ url: config.og_image || '/og-image.jpg', alt: SITE_NAME }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: SITE_URL,
      languages: { 'pt-BR': SITE_URL },
    },
    manifest: '/manifest.json',
    icons: config.favicon_url
      ? { icon: [{ url: config.favicon_url }], apple: [{ url: config.favicon_url }] }
      : {
          icon: [
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          ],
          apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
          other: [{ rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#010744' }],
        },
    // Verification codes from DB — blank string = not set = tag not rendered
    verification: {
      google: config.google_site_verification || undefined,
      other: config.bing_verification
        ? { 'msvalidate.01': config.bing_verification }
        : undefined,
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // getSiteConfig is React.cache() — called multiple times but hits DB only once per request
  const config = await getSiteConfig()

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['RealEstateAgent', 'LocalBusiness'],
    '@id': `${SITE_URL}/#organization`,
    name: config.company_name || SITE_NAME,
    description: config.meta_description || 'Imobiliária especializada em imóveis residenciais e comerciais.',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: config.logo_url || `${SITE_URL}/logo.png` },
    image: config.og_image || `${SITE_URL}/og-image.jpg`,
    telephone: config.phone || undefined,
    email: config.email || undefined,
    address: config.address
      ? { '@type': 'PostalAddress', streetAddress: config.address, addressCountry: 'BR' }
      : undefined,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '08:00', closes: '12:00' },
    ],
    sameAs: [config.instagram, config.facebook, config.linkedin, config.youtube].filter(Boolean),
    priceRange: '$$',
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: config.company_name || SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/comprar?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'pt-BR',
  }

  const primary = config.primary_color || '#010744'
  const accent = config.accent_color || '#f2d22e'
  const tertiary = config.tertiary_color || '#ededd1'

  const brandCss = `:root {
  --brand-primary: ${primary};
  --brand-accent: ${accent};
  --brand-tertiary: ${tertiary};
}`

  return (
    <html lang="pt-BR" className={`${raleway.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://snap.licdn.com" />
        <link rel="dns-prefetch" href="https://analytics.tiktok.com" />
        <style dangerouslySetInnerHTML={{ __html: brandCss }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {/* GTM noscript — first element inside body */}
        <GtmNoScript />

        {/* Schema.org structured data */}
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />

        <Header
          logoUrl={config.logo_header_url || config.logo_url}
          companyName={config.company_name}
          phone={config.phone}
          email={config.email}
        />
        <main className="flex-1">{children}</main>
        <Footer
          logoUrl={config.logo_footer_url || config.logo_url}
          companyName={config.company_name}
        />

        <WhatsAppFab whatsapp={config.whatsapp_full || config.whatsapp} />

        {/* Third-party scripts — loaded afterInteractive, IDs from DB */}
        <ThirdPartyScripts />
      </body>
    </html>
  )
}
