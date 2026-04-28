import { ChevronDown } from 'lucide-react'
import { FaqJsonLd } from '@/components/seo/JsonLd'

interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  title?: string
  subtitle?: string
  items?: FaqItem[]
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: 'Como funciona a avaliação gratuita do meu imóvel?',
    answer:
      'Você preenche um formulário curto com tipo, localização e características do imóvel. Em até 24h úteis, um corretor especialista no seu bairro entra em contato com a avaliação de mercado baseada em vendas reais.',
  },
  {
    question: 'A Morejá cobra taxa para encontrar imóveis para alugar ou comprar?',
    answer:
      'Não. Para o comprador ou inquilino, nossa busca é 100% gratuita. A comissão é paga pelo proprietário do imóvel, conforme tabela oficial do CRECI da região.',
  },
  {
    question: 'Quais documentos preciso para alugar um imóvel?',
    answer:
      'Tipicamente: documento de identidade, CPF, comprovante de residência atual, três últimos contracheques ou comprovante de renda, e comprovante do tipo de garantia escolhida (fiador, seguro fiança, depósito caução). Cada imóvel pode ter exigências adicionais — converse com nosso corretor.',
  },
  {
    question: 'Como simulo o financiamento de um imóvel?',
    answer:
      'Na página de cada imóvel à venda há um simulador de financiamento que abre o portal da Caixa ou do Banco do Brasil já com o valor pré-preenchido. Para uma análise personalizada de crédito, fale com nosso corretor.',
  },
  {
    question: 'Atendem em quais cidades?',
    answer:
      'Recife, Olinda, Jaboatão dos Guararapes, Paulista, Caruaru e Petrolina. Veja o mapa completo de cobertura ou o guia de bairros para ver onde temos especialistas locais.',
  },
  {
    question: 'A Morejá oferece imóveis comerciais e residenciais?',
    answer:
      'Sim. Trabalhamos com apartamentos, casas, coberturas, terrenos, salas comerciais, lojas e galpões — tanto para venda quanto para locação.',
  },
]

/**
 * FAQ accordion com schema FAQPage embed (rich snippet no Google).
 * Pode ser usado na home (sectionMap.faq) ou em /sobre / /contato.
 *
 * Server component — usa &lt;details&gt;/&lt;summary&gt; nativo (zero JS, acessível
 * via teclado, suporta navegação por # link).
 */
export function FaqAccordion({
  title = 'Perguntas frequentes',
  subtitle = 'Respostas rápidas para as dúvidas mais comuns sobre comprar, alugar e avaliar imóveis com a Morejá.',
  items = DEFAULT_FAQS,
}: FaqAccordionProps) {
  if (items.length === 0) return null

  return (
    <section className="section bg-white" id="faq">
      <FaqJsonLd faqs={items} />
      <div className="container-page max-w-3xl">
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#f2d22e] mb-3">
            FAQ
          </span>
          <h2 className="heading-h2 text-[#010744] mb-3">{title}</h2>
          <p className="lead">{subtitle}</p>
        </div>

        <div className="divide-y divide-gray-100 border-y border-gray-100">
          {items.map((item, i) => (
            <details
              key={i}
              className="group py-5"
              {...(i === 0 ? { open: true } : {})}
            >
              <summary
                className="flex cursor-pointer list-none items-start justify-between gap-4
                           text-left font-semibold text-[#010744]
                           [&::-webkit-details-marker]:hidden"
              >
                <span className="text-base sm:text-lg">{item.question}</span>
                <ChevronDown
                  className="mt-1 h-5 w-5 shrink-0 text-[#f2d22e] transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="mt-3 text-gray-600 leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Não encontrou sua resposta?{' '}
          <a
            href="/contato"
            className="font-semibold text-[#010744] underline-offset-2 hover:underline hover:text-[#f2d22e]"
          >
            Fale com nossa equipe
          </a>
          .
        </p>
      </div>
    </section>
  )
}
