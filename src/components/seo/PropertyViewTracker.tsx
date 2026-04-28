'use client'

import { useEffect } from 'react'
import { trackPropertyView } from './PixelEvents'

/**
 * Disparado uma vez por mount na página de detalhe do imóvel.
 * Plug em /imovel/[id]/page.tsx e /empreendimentos/[id]/page.tsx logo
 * abaixo do JsonLd.
 */
export function PropertyViewTracker({
  property,
}: {
  property: { id: string; titulo: string; preco: number; tipo?: string }
}) {
  useEffect(() => {
    trackPropertyView(property)
    // Apenas no mount — sem dependências p/ não disparar duas vezes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
