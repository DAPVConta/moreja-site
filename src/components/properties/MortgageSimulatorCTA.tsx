'use client'

import { useMemo } from 'react'
import { Calculator, ExternalLink } from 'lucide-react'
import { SIMULATOR_URL } from '@/lib/simulator'

interface MortgageSimulatorCTAProps {
  /** Valor do imóvel em reais (price). */
  preco: number
  /** Cidade/UF para passar como contexto. */
  cidade?: string
  estado?: string
  /** Renda família estimada (opcional, default 30% do imóvel/360 meses para sugestão). */
  rendaSugerida?: number
}

/**
 * CTA que abre o simulador de financiamento da Morejá em nova aba
 * (link direto, sem parâmetros).
 *
 * A URL é configurável via NEXT_PUBLIC_SIMULATOR_URL para permitir
 * trocar o domínio do simulador sem alterar código.
 */
export function MortgageSimulatorCTA({
  preco,
  rendaSugerida,
}: MortgageSimulatorCTAProps) {
  // Sugestão de renda: 30% comprometimento em 360 meses ≈ valor / 100
  const renda = useMemo(() => {
    if (rendaSugerida) return rendaSugerida
    return Math.round(preco / 100 / 100) * 100 // arredondado a R$100
  }, [preco, rendaSugerida])

  return (
    <div className="rounded-xl border border-gray-100 bg-[#ededd1]/40 p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#010744] text-[#f2d22e]">
          <Calculator size={18} />
        </span>
        <div>
          <h3 className="text-base font-bold text-[#010744]">Simule o financiamento</h3>
          <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">
            Em até 35 anos, com SBPE ou FGTS. Renda mínima sugerida: R$ {renda.toLocaleString('pt-BR')}/mês.
          </p>
        </div>
      </div>

      <a
        href={SIMULATOR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-lg bg-[#010744] px-4 py-3
                   text-sm font-semibold text-white transition-colors
                   hover:bg-[#010744]/90"
      >
        <span>Simular financiamento</span>
        <ExternalLink size={14} aria-hidden="true" />
      </a>

      <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
        A simulação abre em uma nova aba.
      </p>
    </div>
  )
}
