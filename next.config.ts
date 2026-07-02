import type { NextConfig } from 'next'

// Simulador de financiamento hospedado na Netlify, servido via proxy em
// /simulacao-financiamento para o usuário enxergar apenas o nosso domínio.
const SIMULATOR_ORIGIN = 'https://inspiring-yeot-ec0490.netlify.app'

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  images: {
    // SVGs locais em /public/fallbacks/ são gerados por nós (sem JS hostil).
    // contentSecurityPolicy força sandbox no <img> servido pelo otimizador,
    // protegendo contra qualquer SVG remoto que venha a ser configurado.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yxlepgmlhcnqhwshymup.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'api.supremocrm.com.br',
      },
      {
        protocol: 'https',
        hostname: '**.supremocrm.com.br',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sistemasupremo.com.br',
      },
      {
        protocol: 'https',
        hostname: '**.sistemasupremo.com.br',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  // Admin CMS (Vite SPA) servido em /admin/*. Arquivos estáticos em
  // public/admin/ têm prioridade; qualquer rota do React Router que não
  // bata com arquivo cai no index.html do SPA.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        // Simulador de financiamento (app externo na Netlify) proxied sob
        // o nosso domínio — o usuário nunca vê a URL da Netlify.
        {
          source: '/simulacao-financiamento',
          destination: `${SIMULATOR_ORIGIN}/simulacao-financiamento`,
        },
        {
          source: '/simulacao-financiamento/:path*',
          destination: `${SIMULATOR_ORIGIN}/simulacao-financiamento/:path*`,
        },
      ],
      fallback: [
        { source: '/admin', destination: '/admin/index.html' },
        { source: '/admin/:path*', destination: '/admin/index.html' },
        // Assets do simulador — o app da Netlify também é Next.js, então os
        // chunks/CSS/fontes dele vêm de /_next/static com hashes de OUTRO
        // build. Fallback só dispara quando o arquivo não existe no nosso
        // build (docs: roda após checar _next/static), então os nossos
        // assets têm sempre prioridade e não há colisão de hash.
        {
          source: '/_next/static/:path*',
          destination: `${SIMULATOR_ORIGIN}/_next/static/:path*`,
        },
      ],
    }
  },
  // Security + SEO headers
  async headers() {
    return [
      {
        // Site público — defaults seguros
        source: '/((?!admin).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(), microphone=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Admin SPA — gates extras: noindex em qualquer crawl,
        // frame-ancestors none (clickjacking prevention),
        // no-store cache (sempre busca a versão mais nova).
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default nextConfig
