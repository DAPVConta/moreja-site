import type { NextConfig } from 'next'

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
      afterFiles: [],
      fallback: [
        { source: '/admin', destination: '/admin/index.html' },
        { source: '/admin/:path*', destination: '/admin/index.html' },
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
