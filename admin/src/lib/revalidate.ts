import { supabase } from './supabase'

/**
 * Dispara revalidação ISR de páginas do site público após salvar conteúdo
 * no admin. Sem isto, mudanças só apareceriam quando expirasse o `revalidate`
 * (ex: home tem 300s).
 *
 * O endpoint vive no app Next.js (`/api/revalidate`) — mesma origem do admin
 * em produção (admin é servido como SPA sob `/admin`).
 *
 * Falha silenciosa: se a revalidação falhar (rede, deploy antigo sem a rota,
 * etc.) o save no Supabase já foi feito; quem visitar verá depois quando
 * o ISR expirar normalmente.
 */
export async function revalidatePublicPaths(paths: string[] = ['/']): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return

    await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paths }),
    })
  } catch {
    // ignorado — ver doc acima
  }
}
