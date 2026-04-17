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
}

export default nextConfig
