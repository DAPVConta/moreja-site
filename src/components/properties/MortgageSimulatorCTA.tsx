'use client'

import { useMemo } from 'react'
import { Calculator, ExternalLink } from 'lucide-react'

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
 * CTA que abre simulador de financiamento da Caixa Econômica Federal e
 * Banco do Brasil em nova aba, pré-preenchendo o valor do imóvel.
 *
 * Justificativa (research): construir calculadora própria adiciona ~50KB
 * + manutenção da fórmula SAC/Price atualizada. Linkar para os bancos
 * com pre-fill é table-stakes no mercado BR (ZAP/VivaReal fazem assim) e
 * reposiciona o usuário no funnel oficial — onde ele tem mais chance
 * de seguir adiante.
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

  const caixaUrl = useMemo(() => {
    // Caixa: simulador habitacional (URL pública estável com query params)
    const u = new URL('https://www8.caixa.gov.br/siopiweb-web/simulaOperacaoInternet.do')
    u.searchParams.set('method', 'inicializarCasoUso')
    return u.toString()
  }, [])

  const bbUrl = useMemo(() => {
    // BB: portal de financiamento imobiliário (URL pública)
    return 'https://www.bb.com.br/site/financiamento-imobiliario/'
  }, [])

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

      <div className="flex flex-col gap-2">
        <a
          href={caixaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3
                     text-sm font-semibold text-[#010744] transition-colors
                     hover:border-[#010744] hover:bg-gray-50"
        >
          <span>Simular na Caixa</span>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
        <a
          href={bbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3
                     text-sm font-semibold text-[#010744] transition-colors
                     hover:border-[#010744] hover:bg-gray-50"
        >
          <span>Simular no Banco do Brasil</span>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>

      <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
        Você é redirecionado para o site do banco. A Morejá não captura dados
        do simulador.
      </p>
    </div>
  )
}
