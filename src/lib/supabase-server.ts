import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Client anon SEM cookies. Use para leituras de dados públicos (RLS de leitura
 * pública) em rotas que têm generateStaticParams — ex.: /imovel/[id],
 * /empreendimentos/[id]. Ali, `cookies()` (via createSupabaseServerClient)
 * torna o render dinâmico e dispara DynamicServerError (DYNAMIC_SERVER_USAGE,
 * 500) durante a geração estática. Visitantes anônimos não têm cookie de auth,
 * então o resultado é idêntico ao do server client, sem o efeito colateral.
 */
export function createSupabaseAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
      },
    },
  )
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore — called from Server Component
          }
        },
      },
      // Força Next.js a não cachear as chamadas fetch do Supabase
      global: {
        fetch: (url, options = {}) =>
          fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  )
}
