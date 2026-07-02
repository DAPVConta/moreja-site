import { NextResponse } from 'next/server'

// O simulador saiu da Netlify (era servido aqui via proxy de HTML) e agora
// vive em domínio próprio. Este caminho interno vira um redirect permanente
// para não quebrar links antigos (menu, bookmarks, CTAs já indexados).
// URL hardcoded — não usar NEXT_PUBLIC_SIMULATOR_URL aqui: se a env apontar
// para este próprio caminho, viraria loop de redirect.
const SIMULATOR_EXTERNAL_URL =
  'https://simulacao.srv1577302.hstgr.cloud/simulacao-financiamento'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.redirect(SIMULATOR_EXTERNAL_URL, 308)
}
