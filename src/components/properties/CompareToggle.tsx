'use client'

import { useEffect, useState } from 'react'
import { GitCompare, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  isInCompare,
  toggleCompare,
  COMPARE_EVENT,
  COMPARE_MAX,
  type CompareProperty,
} from '@/lib/compare'

interface CompareToggleProps {
  property: CompareProperty
  /** Visual variant — pill (sobre foto) ou button (inline). */
  variant?: 'pill' | 'button'
}

/**
 * Botão de toggle "comparar". Aparece sobre o PropertyCard.
 * Quando há 1+ imóveis no comparador, aparece também pílula flutuante
 * (CompareFloatingBar) levando p/ /comparar.
 */
export function CompareToggle({ property, variant = 'pill' }: CompareToggleProps) {
  const [active, setActive] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setActive(isInCompare(property.id))
    const onChange = () => setActive(isInCompare(property.id))
    window.addEventListener(COMPARE_EVENT, onChange)
    return () => window.removeEventListener(COMPARE_EVENT, onChange)
  }, [property.id])

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const { added, full } = toggleCompare(property)
    if (full) {
      toast.error(`Limite de ${COMPARE_MAX} imóveis no comparador. Remova um para adicionar outro.`)
      return
    }
    toast.success(added ? 'Adicionado ao comparador' : 'Removido do comparador')
  }

  if (!mounted) return null

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`inline-flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-lg
                    text-sm font-semibold transition-colors
                    ${active
                      ? 'bg-[#010744] text-white hover:bg-[#0a1a6e]'
                      : 'border border-[#010744] text-[#010744] hover:bg-[#010744] hover:text-white'}`}
      >
        {active ? <Check size={14} /> : <GitCompare size={14} />}
        {active ? 'No comparador' : 'Comparar'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? 'Remover do comparador' : 'Adicionar ao comparador'}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors
                  ${active
                    ? 'bg-[#010744] text-[#f2d22e]'
                    : 'bg-white/95 text-[#010744] hover:bg-[#f2d22e]'}`}
    >
      {active ? <Check size={16} strokeWidth={3} /> : <GitCompare size={16} />}
    </button>
  )
}
