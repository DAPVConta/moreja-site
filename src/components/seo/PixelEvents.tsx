'use client'

/**
 * Helper functions to fire conversion/tracking events on all configured pixels.
 *
 *   import { trackEvent, trackLead, trackPropertyView } from '@/components/seo/PixelEvents'
 *   trackLead('contato_form')
 *
 * Cada evento gera um `event_id` único compartilhado entre browser pixel e
 * CAPI server-side — o Meta usa para dedup e dar match alto entre browser
 * e server events.
 *
 * Consent gate: respeita Consent Mode v2. Se marketing=denied, o pixel
 * browser não dispara. Se analytics=denied, GA4 não recebe.
 */

import { canFireMarketing, canFireAnalytics, generateEventId } from '@/lib/consent'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lintrk?: (event: string, data?: Record<string, unknown>) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ttq?: { track: (event: string, data?: Record<string, unknown>) => void }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: Record<string, unknown>[]
  }
}

type EventData = Record<string, unknown>

interface UserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
}

const META_STANDARD_EVENTS = [
  'PageView',
  'ViewContent',
  'Search',
  'AddToWishlist',
  'Lead',
  'CompleteRegistration',
  'Contact',
  'FindLocation',
  'SubmitApplication',
  'Schedule',
]

/**
 * Fires an event on all enabled tags (respecting consent), generates a
 * shared event_id, and (if marketing consent) also fires server-side CAPI.
 *
 * Returns the event_id for the caller to optionally include in lead payloads
 * (so the server-side dedup with the leads.event_id column lines up).
 */
export function trackEvent(eventName: string, data?: EventData, user?: UserData): string {
  const event_id = generateEventId()
  if (typeof window === 'undefined') return event_id

  const fullData = { ...data, event_id }

  // GTM dataLayer (sempre, GTM mesmo respeita consent via tags)
  if (window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...fullData })
  }

  // GA4 — só se analytics consent
  if (canFireAnalytics() && typeof window.gtag === 'function') {
    window.gtag('event', eventName, fullData)
  }

  // Marketing pixels — só se marketing consent
  if (canFireMarketing()) {
    if (window.fbq) {
      const isStandard = META_STANDARD_EVENTS.includes(eventName)
      window.fbq(
        isStandard ? 'track' : 'trackCustom',
        eventName,
        fullData,
        { eventID: event_id }
      )
    }
    if (window.lintrk && eventName === 'Lead') {
      window.lintrk('track', { conversion_id: process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID })
    }
    if (window.ttq) {
      window.ttq.track(eventName, fullData)
    }

    // Meta CAPI server-side — fire-and-forget (não bloqueia UI)
    if (META_STANDARD_EVENTS.includes(eventName)) {
      const capiPayload = {
        event_name: eventName,
        event_id,
        event_source_url: window.location.href,
        custom_data: data,
        user_data: user,
      }
      // useBeacon p/ não bloquear unload caso usuário esteja saindo
      try {
        const blob = new Blob([JSON.stringify(capiPayload)], { type: 'application/json' })
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/meta-capi', blob)
        } else {
          fetch('/api/meta-capi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(capiPayload),
            keepalive: true,
          }).catch(() => {})
        }
      } catch {
        /* ignore */
      }
    }
  }

  return event_id
}

/** Shortcut: property page view */
export function trackPropertyView(property: {
  id: string
  titulo: string
  preco: number
  tipo?: string
}): string {
  return trackEvent('ViewContent', {
    content_ids: [property.id],
    content_name: property.titulo,
    content_type: 'product',
    value: property.preco,
    currency: 'BRL',
    content_category: property.tipo,
  })
}

/** Shortcut: lead / contact form submitted */
export function trackLead(origem: string, user?: UserData, value?: number): string {
  return trackEvent(
    'Lead',
    {
      content_name: origem,
      currency: 'BRL',
      ...(value != null ? { value } : {}),
    },
    user
  )
}

/** Shortcut: search performed */
export function trackSearch(query: string): string {
  return trackEvent('Search', { search_string: query })
}

/** Shortcut: tour/visit scheduled */
export function trackSchedule(propertyId: string, when?: string): string {
  return trackEvent('Schedule', {
    content_ids: [propertyId],
    schedule_when: when ?? 'unspecified',
  })
}
