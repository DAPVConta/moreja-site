import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware — Content Security Policy com nonce per-request.
 *
 * Por que nonce?
 *   • Os scripts inline (themeBootstrap em layout.tsx, brandCss style,
 *     ConsentModeInit) PRECISAM rodar — não dá pra mover pra arquivo
 *     externo sem perder o efeito anti-flash / consent default.
 *   • CSP sem 'unsafe-inline' bloqueia script/style inline. Solução
 *     standard: nonce gerado por request + adicionado nos elementos.
 *
 * Como funciona:
 *   1. Aqui (middleware): gera nonce hex aleatório, set request header
 *      'x-nonce' (lido pelo layout.tsx), set CSP response header.
 *   2. layout.tsx (server): lê header 'x-nonce' via next/headers e
 *      passa pra Script/style inline.
 *
 * Limitação Next 16: middleware não pode interceptar /admin (rewrite
 * faz fallback p/ index.html do SPA Vite). Os headers de admin/* ficam
 * no next.config.ts headers() (Bloco 5).
 */
export function middleware(request: NextRequest) {
  // Não aplica em /admin (SPA Vite tem CSP própria via index.html ou config)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Gera nonce de 16 bytes (32 chars hex) — único por request
  const nonce = Buffer.from(crypto.randomUUID().replace(/-/g, '')).toString('base64')

  const cspDirectives = [
    `default-src 'self'`,
    // strict-dynamic: scripts marcados com nonce podem carregar outros scripts
    // (necessário pra GTM/GA4/Meta Pixel que injetam scripts dinamicamente)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    // styles: 'unsafe-inline' apenas. Não usamos nonce em style-src porque
    // CSP3 ignora 'unsafe-inline' quando nonce está presente, e o React
    // aplica `style={{}}` como atributo HTML sem nonce — quebraria tudo.
    // O style inline do brandCss em layout.tsx ainda funciona via unsafe-inline.
    // Trade-off aceito: scripts (vetor crítico de XSS) seguem com nonce
    // strict-dynamic; estilos relaxados.
    `style-src 'self' 'unsafe-inline'`,
    // images: self + Supremo CDN + Supabase storage + brand img CDNs
    `img-src 'self' data: blob: https://*.supremocrm.com.br https://*.sistemasupremo.com.br https://yxlepgmlhcnqhwshymup.supabase.co https://*.unsplash.com https://placehold.co https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com`,
    // fonts: Google Fonts + self (next/font baixa para self)
    `font-src 'self' https://fonts.gstatic.com data:`,
    // network: Supremo + Supabase + analytics + Meta CAPI
    `connect-src 'self' https://yxlepgmlhcnqhwshymup.supabase.co https://api.supremocrm.com.br https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://snap.licdn.com https://analytics.tiktok.com https://www.clarity.ms https://*.clarity.ms https://*.hotjar.com`,
    // frames p/ youtube/maps embed (Google Maps + OpenStreetMap usado no
    // PropertyMap dos detalhes, e tour_virtual de qualquer https quando o
    // imóvel tem URL externa cadastrada — mantemos a allowlist conservadora).
    `frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://www.openstreetmap.org`,
    // proibidos — defensa em profundidade
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://yxlepgmlhcnqhwshymup.supabase.co`,
    `frame-ancestors 'self'`,
    `upgrade-insecure-requests`,
  ]

  const csp = cspDirectives.join('; ')

  // Propaga nonce p/ request (layout.tsx lê)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  // Tambem set no response header pra debug/SecurityHeaders.com
  requestHeaders.set('content-security-policy', csp)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // CSP no response (cliente vê)
  response.headers.set('content-security-policy', csp)

  return response
}

export const config = {
  matcher: [
    // Aplica em todas as rotas exceto:
    //  /admin (SPA Vite separada)
    //  /api/* (server routes têm headers próprios)
    //  /_next/* (assets estáticos)
    //  arquivos com extensão (favicon, robots.txt, sitemap.xml, etc)
    {
      source: '/((?!admin|api|_next/static|_next/image|favicon\\.ico|robots\\.txt|.*\\..*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
