import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
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
}

export default nextConfig
