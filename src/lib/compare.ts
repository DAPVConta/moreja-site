/**
 * Comparador de imóveis — sessionStorage (persiste durante a navegação,
 * limpa ao fechar o tab). Permite até 3 imóveis selecionados.
 *
 * UX: botão de toggle no PropertyCard adiciona/remove. Quando há 1+ no
 * comparador, aparece pílula flutuante "Comparar (N) →" no canto inferior
 * direito que leva pra /comparar.
 */

export interface CompareProperty {
  id: string
  titulo: string
  preco: number
  finalidade: string
  tipo: string
  bairro: string
  cidade: string
  area_total: number
  quartos: number
  banheiros: number
  vagas: number
  fotos: string[]
  href: string
  preco_condominio?: number | undefined
  preco_iptu?: number | undefined
}

const STORAGE_KEY = 'moreja:compare'
const MAX_ITEMS = 3
const EVENT = 'moreja:compare-changed'

export function readCompare(): CompareProperty[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CompareProperty[]
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : []
  } catch {
    return []
  }
}

export function isInCompare(id: string): boolean {
  return readCompare().some((p) => p.id === id)
}

export function toggleCompare(p: CompareProperty): { added: boolean; full: boolean } {
  if (typeof window === 'undefined') return { added: false, full: false }
  const current = readCompare()
  const exists = current.find((x) => x.id === p.id)
  let next: CompareProperty[]
  let added = false
  let full = false

  if (exists) {
    next = current.filter((x) => x.id !== p.id)
  } else {
    if (current.length >= MAX_ITEMS) {
      full = true
      return { added: false, full }
    }
    next = [...current, p]
    added = true
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {
    /* ignore */
  }

  return { added, full }
}

export function clearCompare() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {
    /* ignore */
  }
}

export const COMPARE_EVENT = EVENT
export const COMPARE_MAX = MAX_ITEMS
