'use client'

/**
 * Helper functions to fire conversion/tracking events on all configured pixels.
 * Import and call these from client components on key user actions.
 *
 * Usage:
 *   import { trackEvent } from '@/components/seo/PixelEvents'
 *   trackEvent('Lead', { content_name: 'Contact Form' })
 *   trackEvent('ViewContent', { content_ids: [propertyId], content_type: 'property' })
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lintrk?: (event: string, data?: Record<string, unknown>) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ttq?: { track: (event: string, data?: Record<string, unknown>) => void }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: Record<string, unknown>[]
  }
}

type EventData = Record<string, unknown>

/** Fire a named event across all configured pixels + GTM dataLayer */
export function trackEvent(eventName: string, data?: EventData) {
  if (typeof window === 'undefined') return

  // Google Tag Manager dataLayer
  if (window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...data })
  }

  // Meta (Facebook) Pixel
  if (window.fbq) {
    const standardEvents = [
      'PageView', 'ViewContent', 'Search', 'AddToWishlist', 'Lead',
      'CompleteRegistration', 'Contact', 'FindLocation', 'SubmitApplication',
    ]
    if (standardEvents.includes(eventName)) {
      window.fbq('track', eventName, data)
    } else {
      window.fbq('trackCustom', eventName, data)
    }
  }

  // LinkedIn Insight — fires conversion events
  if (window.lintrk && eventName === 'Lead') {
    window.lintrk('track', { conversion_id: process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID })
  }

  // TikTok Pixel
  if (window.ttq) {
    window.ttq.track(eventName, data)
  }
}

/** Shortcut: property page view */
export function trackPropertyView(property: {
  id: string
  titulo: string
  preco: number
  tipo?: string
}) {
  trackEvent('ViewContent', {
    content_ids: [property.id],
    content_name: property.titulo,
    content_type: 'product',
    value: property.preco,
    currency: 'BRL',
    content_category: property.tipo,
  })
}

/** Shortcut: lead / contact form submitted */
export function trackLead(origem: string) {
  trackEvent('Lead', { content_name: origem, currency: 'BRL' })
}

/** Shortcut: search performed */
export function trackSearch(query: string) {
  trackEvent('Search', { search_string: query })
}
