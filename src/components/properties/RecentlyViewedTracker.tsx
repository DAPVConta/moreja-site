'use client'

import { useEffect } from 'react'
import { pushRecentlyViewed } from '@/lib/recently-viewed'
import type { Property } from '@/types/property'

/**
 * Plug em /imovel/[id] e /empreendimentos/[id] page server components —
 * grava o imóvel atual no histórico localStorage. Não renderiza nada.
 */
export function RecentlyViewedTracker({ property }: { property: Property }) {
  useEffect(() => {
    pushRecentlyViewed({
      id: property.id,
      titulo: property.titulo,
      preco: property.preco,
      foto: property.fotos[0] ?? null,
      finalidade: property.finalidade,
      bairro: property.bairro,
      cidade: property.cidade,
      tipo: property.tipo,
      href: property.tipo === 'Empreendimento'
        ? `/empreendimentos/${property.id}`
        : `/imovel/${property.id}`,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id])
  return null
}
