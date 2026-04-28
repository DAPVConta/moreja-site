/**
 * Consent Mode v2 — gestão de consentimento LGPD compliant.
 *
 * Categorias:
 *   • functional  — sempre granted (essencial pro site funcionar)
 *   • analytics   — GA4, Clarity, Hotjar
 *   • marketing   — Meta Pixel, Google Ads, LinkedIn, TikTok
 *
 * Storage: localStorage `moreja:consent` JSON.
 * Estado inicial (sem decisão): default 'denied' em tudo (analytics + marketing).
 */

export type ConsentCategory = 'functional' | 'analytics' | 'marketing'

export interface ConsentState {
  status: 'pending' | 'granted' | 'denied' | 'partial'
  analytics: boolean
  marketing: boolean
  functional: true
  timestamp: number
}

const STORAGE_KEY = 'moreja:consent'

export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    if (typeof parsed.status === 'string' && typeof parsed.timestamp === 'number') {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function writeConsent(state: Omit<ConsentState, 'timestamp'>): ConsentState {
  const full: ConsentState = { ...state, timestamp: Date.now() }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full))
  } catch {
    /* ignore quota */
  }
  applyConsentToTags(full)
  // Custom event para o resto do app reagir (ex: lazy-load de pixels)
  window.dispatchEvent(new CustomEvent('moreja:consent-changed', { detail: full }))
  return full
}

/** Sinaliza categorias permitidas para Google Consent Mode v2 e dataLayer. */
export function applyConsentToTags(state: ConsentState) {
  if (typeof window === 'undefined') return
  const w = window as Window & {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }

  const consent = {
    ad_storage: state.marketing ? 'granted' : 'denied',
    ad_user_data: state.marketing ? 'granted' : 'denied',
    ad_personalization: state.marketing ? 'granted' : 'denied',
    analytics_storage: state.analytics ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    personalization_storage: state.functional ? 'granted' : 'denied',
  }

  if (typeof w.gtag === 'function') {
    w.gtag('consent', 'update', consent)
  }
  // Push p/ dataLayer caso GTM esteja gerenciando
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: 'consent_update', consent })
  }
}

export function canFireMarketing(): boolean {
  const c = readConsent()
  return c != null && c.marketing === true
}

export function canFireAnalytics(): boolean {
  const c = readConsent()
  return c != null && c.analytics === true
}

/** Helper para gerar event_id usado em dedup CAPI ↔ Pixel browser. */
export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
