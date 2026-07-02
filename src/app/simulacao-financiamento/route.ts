import { NextResponse } from 'next/server'

// App do simulador de financiamento hospedado na Netlify (também Next.js).
// Servimos o HTML dele sob o nosso domínio e reescrevemos os assets
// (/_next/*) para URLs absolutas da Netlify — na Vercel, arquivos
// /_next/static inexistentes retornam 404 direto do CDN sem passar pelos
// rewrites de fallback, então proxy de assets via next.config não funciona.
const SIMULATOR_ORIGIN =
  process.env.SIMULATOR_ORIGIN ?? 'https://inspiring-yeot-ec0490.netlify.app'

// Sempre executa em runtime (nunca pré-renderiza no build) — o conteúdo vem
// de origem externa; o cache fica no fetch (revalidate) abaixo.
export const dynamic = 'force-dynamic'

export async function GET() {
  let res: Response
  try {
    res = await fetch(`${SIMULATOR_ORIGIN}/simulacao-financiamento`, {
      // Revalida a cada 5 min — o app do simulador muda raramente.
      next: { revalidate: 300 },
    })
  } catch {
    return new NextResponse('Simulador temporariamente indisponível.', {
      status: 502,
    })
  }

  if (!res.ok) {
    return new NextResponse('Simulador temporariamente indisponível.', {
      status: 502,
    })
  }

  // Assets absolutos p/ Netlify (scripts, CSS, fontes, next/image e os
  // preload hints no payload RSC — todos começam com /_next/).
  const html = (await res.text()).replaceAll(
    '/_next/',
    `${SIMULATOR_ORIGIN}/_next/`
  )

  // Não repassamos os headers da Netlify: o CSP dela bloquearia os próprios
  // assets agora servidos cross-origin.
  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}
