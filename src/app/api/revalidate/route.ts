import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

/**
 * Revalida páginas ISR sob demanda. Chamado pelo admin SPA logo após salvar
 * mudanças que afetam páginas públicas (home_sections, banners, site_config,
 * etc.) — caso contrário o usuário precisaria esperar a janela do `revalidate`
 * (ex: home tem 300s) ou um redeploy.
 *
 * Auth: Bearer token do Supabase (sessão do admin). Verificamos que o usuário
 * existe e está em `admin_users` antes de revalidar — evita que qualquer
 * cliente anônimo consiga forçar invalidação.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  if (!token) {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  // Cliente vinculado ao token do usuário (RLS aplica como aquele usuário).
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userRes, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }

  // is_admin: presença em admin_users é o suficiente (RLS permite o próprio
  // usuário ler seu registro, conforme policies da migration 009).
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', userRes.user.id)
    .maybeSingle()

  if (!adminRow) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: { paths?: string[] } = {}
  try {
    body = await req.json()
  } catch {
    // body opcional — default revalida só a home
  }

  const paths = Array.isArray(body.paths) && body.paths.length > 0 ? body.paths : ['/']

  // Sanity: só aceita paths absolutos do próprio site.
  const safePaths = paths.filter((p) => typeof p === 'string' && p.startsWith('/'))

  for (const p of safePaths) {
    revalidatePath(p)
  }

  return NextResponse.json({ revalidated: safePaths, at: Date.now() })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
