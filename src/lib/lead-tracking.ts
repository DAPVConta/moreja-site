/**
 * Helpers client-side para enriquecer payloads de lead com:
 *   • UTM (utm_source, utm_medium, utm_campaign, utm_content, utm_term)
 *   • gclid (Google Ads click), fbclid (Meta click)
 *   • _fbp / _fbc (cookies Meta — útil pro CAPI dedup)
 *   • ga_client_id (cookie GA4 _ga)
 *   • referrer + page_url + consent_lgpd flag
 *
 * Os UTMs são "stick" — gravados em localStorage no first touch e usados
 * em todos os leads subsequentes daquela visita até serem sobrescritos.
 *
 * Uso típico:
 *   import { collectLeadTracking } from '@/lib/lead-tracking'
 *   const tracking = collectLeadTracking()
 *   fetch('/functions/v1/send-lead', { body: JSON.stringify({ ...form, ...tracking }) })
 */

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const

const STICK_KEY = 'moreja:utm-first-touch'

export interface LeadTrackingData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  gclid?: string
  fbclid?: string
  fbp?: string
  fbc?: string
  ga_client_id?: string
  referrer?: string
  page_url?: string
  consent_lgpd?: boolean
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

function readQueryParam(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  const v = new URLSearchParams(window.location.search).get(key)
  return v && v.length > 0 ? v : undefined
}

function persistFirstTouchUTMs() {
  if (typeof window === 'undefined') return
  try {
    const existing = localStorage.getItem(STICK_KEY)
    if (existing) return // já gravado em visit anterior — first touch fica
    const params = new URLSearchParams(window.location.search)
    const collected: Record<string, string> = {}
    for (const k of UTM_KEYS) {
      const v = params.get(k)
      if (v) collected[k] = v
    }
    if (Object.keys(collected).length > 0) {
      localStorage.setItem(STICK_KEY, JSON.stringify(collected))
    }
  } catch { /* ignore */ }
}

function readStickyUTMs(): Partial<Record<typeof UTM_KEYS[number], string>> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STICK_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function readConsentLgpd(): boolean | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = localStorage.getItem('moreja:consent')
    if (!raw) return undefined
    const c = JSON.parse(raw) as { status?: string }
    return c.status === 'granted' || c.status === 'partial'
  } catch {
    return undefined
  }
}

/**
 * Chame uma vez no client-side (ex: useEffect no layout) p/ persistir
 * o UTM da primeira visita.
 */
export function initLeadTracking() {
  persistFirstTouchUTMs()
}

export function collectLeadTracking(): LeadTrackingData {
  if (typeof window === 'undefined') return {}

  // First-touch (sticky) ou current touch
  const sticky = readStickyUTMs()
  const current = Object.fromEntries(
    UTM_KEYS.map((k) => [k, readQueryParam(k)]).filter(([, v]) => !!v)
  )

  // Last-touch sobrescreve only se houver param na URL atual; senão usa sticky
  const utm = { ...sticky, ...current }

  const gclid = readQueryParam('gclid')
  const fbclid = readQueryParam('fbclid')

  // GA4 _ga cookie format: GA1.2.123456789.123456789 → client_id é parte 3.4
  const gaCookie = readCookie('_ga')
  const ga_client_id = gaCookie ? gaCookie.split('.').slice(2).join('.') : undefined

  return {
    ...utm,
    gclid,
    fbclid,
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc'),
    ga_client_id,
    referrer: document.referrer || undefined,
    page_url: window.location.href,
    consent_lgpd: readConsentLgpd(),
  }
}
