'use client'

import { useEffect } from 'react'
import { initLeadTracking } from '@/lib/lead-tracking'

/**
 * Renderizado uma vez no layout — persiste UTMs do first touch em
 * localStorage para que toda submissão de lead na visita carregue
 * a origem original (não só o último click).
 */
export function LeadTrackingInit() {
  useEffect(() => {
    initLeadTracking()
  }, [])
  return null
}
