/**
 * Recently viewed properties — localStorage-backed (zero backend).
 * Cada visita ao /imovel/[id] grava um registro mínimo (id, titulo, foto,
 * preço, slug). Mostra carrossel "Vistos recentemente" na home e no fim
 * da página de detalhe.
 */

export interface RecentlyViewedProperty {
  id: string
  titulo: string
  preco: number
  foto: string | null
  finalidade: string
  bairro: string
  cidade: string
  tipo: string
  href: string
  viewedAt: number
}

const STORAGE_KEY = 'moreja:recently-viewed'
const MAX_ITEMS = 12

export function readRecentlyViewed(): RecentlyViewedProperty[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentlyViewedProperty[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((p) => p && typeof p.id === 'string')
      .slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

export function pushRecentlyViewed(p: Omit<RecentlyViewedProperty, 'viewedAt'>) {
  if (typeof window === 'undefined') return
  try {
    const current = readRecentlyViewed()
    const filtered = current.filter((x) => x.id !== p.id)
    const next = [{ ...p, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('moreja:recently-viewed-changed'))
  } catch {
    /* ignore quota */
  }
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('moreja:recently-viewed-changed'))
  } catch {
    /* ignore */
  }
}
