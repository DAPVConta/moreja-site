'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  GitCompare,
  X,
  Bed,
  Bath,
  Car,
  Maximize2,
  MapPin,
  ArrowLeft,
  Check,
  Minus,
} from 'lucide-react'
import {
  readCompare,
  toggleCompare,
  clearCompare,
  COMPARE_EVENT,
  type CompareProperty,
} from '@/lib/compare'
import { formatPrice, formatArea } from '@/lib/format'

export default function CompararPage() {
  const [items, setItems] = useState<CompareProperty[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setItems(readCompare())
    const onChange = () => setItems(readCompare())
    window.addEventListener(COMPARE_EVENT, onChange)
    return () => window.removeEventListener(COMPARE_EVENT, onChange)
  }, [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <section className="section bg-white">
        <div className="container-page max-w-2xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#ededd1]">
            <GitCompare className="h-8 w-8 text-[#010744]" />
          </div>
          <h1 className="heading-h2 text-[#010744] mb-3">Comparador vazio</h1>
          <p className="lead mb-8">
            Selecione até 3 imóveis para comparar características lado a lado.
            Vá pra busca e clique no ícone <GitCompare className="inline w-4 h-4" />{' '}
            sobre os cards.
          </p>
          <Link
            href="/comprar"
            className="inline-flex items-center gap-2 min-h-[48px] rounded-xl bg-[#f2d22e] px-6
                       font-bold text-[#010744] shadow-lg
                       hover:brightness-105 active:scale-[0.98]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Ver imóveis à venda
          </Link>
        </div>
      </section>
    )
  }

  const cols = items.length
  const gridStyle = { gridTemplateColumns: `200px repeat(${cols}, minmax(220px, 1fr))` }

  return (
    <section className="section bg-white">
      <div className="container-page">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#f2d22e] mb-2">
              <GitCompare size={12} aria-hidden="true" />
              Comparador
            </span>
            <h1 className="heading-h2 text-[#010744]">
              Comparando {items.length} imó{items.length === 1 ? 'vel' : 'veis'}
            </h1>
          </div>
          <button
            type="button"
            onClick={clearCompare}
            className="text-sm text-gray-500 hover:text-[#010744] underline-offset-2 hover:underline"
          >
            Limpar tudo
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="min-w-[700px] grid gap-3" style={gridStyle}>
            {/* Sticky labels column */}
            <div /> {/* canto vazio */}
            {items.map((p) => (
              <div key={`hdr-${p.id}`} className="relative rounded-xl overflow-hidden bg-[#ededd1]/40">
                <button
                  type="button"
                  onClick={() => toggleCompare(p)}
                  aria-label="Remover do comparador"
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#010744] hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
                <Link href={p.href} className="block">
                  <div className="relative aspect-[4/3] bg-gray-100">
                    {p.fotos[0] && (
                      <Image
                        src={p.fotos[0]}
                        alt={p.titulo}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-[#010744] line-clamp-2 leading-tight mb-1">
                      {p.titulo}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                      <MapPin size={11} className="text-[#f2d22e]" aria-hidden="true" />
                      {p.bairro}, {p.cidade}
                    </p>
                    <p className="text-lg font-bold text-[#010744]">
                      {formatPrice(p.preco)}
                      {p.finalidade === 'Locação' && (
                        <span className="text-[11px] font-normal text-gray-400">/mês</span>
                      )}
                    </p>
                  </div>
                </Link>
              </div>
            ))}

            {/* Rows */}
            <CompareRow label="Tipo" values={items.map((p) => p.tipo)} />
            <CompareRow label="Finalidade" values={items.map((p) => p.finalidade)} />
            <CompareRow
              label="Área total"
              icon={<Maximize2 size={14} />}
              values={items.map((p) => (p.area_total > 0 ? formatArea(p.area_total) : '—'))}
              highlight="max"
              numericValues={items.map((p) => p.area_total)}
            />
            <CompareRow
              label="Quartos"
              icon={<Bed size={14} />}
              values={items.map((p) => (p.quartos > 0 ? String(p.quartos) : '—'))}
              numericValues={items.map((p) => p.quartos)}
              highlight="max"
            />
            <CompareRow
              label="Banheiros"
              icon={<Bath size={14} />}
              values={items.map((p) => (p.banheiros > 0 ? String(p.banheiros) : '—'))}
              numericValues={items.map((p) => p.banheiros)}
              highlight="max"
            />
            <CompareRow
              label="Vagas"
              icon={<Car size={14} />}
              values={items.map((p) => (p.vagas > 0 ? String(p.vagas) : '—'))}
              numericValues={items.map((p) => p.vagas)}
              highlight="max"
            />
            <CompareRow
              label="Condomínio"
              values={items.map((p) =>
                p.preco_condominio ? formatPrice(p.preco_condominio) : '—'
              )}
              numericValues={items.map((p) => p.preco_condominio ?? Infinity)}
              highlight="min"
            />
            <CompareRow
              label="IPTU"
              values={items.map((p) => (p.preco_iptu ? formatPrice(p.preco_iptu) : '—'))}
              numericValues={items.map((p) => p.preco_iptu ?? Infinity)}
              highlight="min"
            />
            <CompareRow
              label="Preço m²"
              values={items.map((p) =>
                p.area_total > 0 ? formatPrice(Math.round(p.preco / p.area_total)) : '—'
              )}
              numericValues={items.map((p) =>
                p.area_total > 0 ? p.preco / p.area_total : Infinity
              )}
              highlight="min"
            />

            {/* CTA row */}
            <div className="flex items-center text-sm font-semibold text-[#010744]">
              Ações
            </div>
            {items.map((p) => (
              <div key={`cta-${p.id}`} className="flex flex-col gap-2">
                <Link
                  href={p.href}
                  className="inline-flex items-center justify-center min-h-[40px] rounded-lg
                             bg-[#010744] px-3 text-sm font-semibold text-white
                             hover:bg-[#0a1a6e]"
                >
                  Ver detalhes
                </Link>
                <Link
                  href={`${p.href}#contato`}
                  className="inline-flex items-center justify-center min-h-[40px] rounded-lg
                             border border-[#010744]/20 px-3 text-sm text-[#010744]
                             hover:border-[#010744] hover:bg-[#010744] hover:text-white"
                >
                  Tenho interesse
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/comprar"
            className="inline-flex items-center gap-2 text-sm text-[#010744] font-semibold hover:text-[#f2d22e]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Continuar buscando imóveis
          </Link>
        </div>
      </div>
    </section>
  )
}

interface CompareRowProps {
  label: string
  icon?: React.ReactNode
  values: string[]
  /** Se 'max'/'min', destaca o valor maior/menor com badge accent. */
  highlight?: 'max' | 'min'
  numericValues?: number[]
}

function CompareRow({ label, icon, values, highlight, numericValues }: CompareRowProps) {
  // Determina índice do "vencedor" se highlight estiver definido
  let winnerIdx = -1
  if (highlight && numericValues) {
    const valid = numericValues
      .map((v, i) => ({ v, i }))
      .filter((x) => isFinite(x.v) && x.v > 0)
    if (valid.length > 1) {
      winnerIdx =
        highlight === 'max'
          ? valid.reduce((a, b) => (b.v > a.v ? b : a)).i
          : valid.reduce((a, b) => (b.v < a.v ? b : a)).i
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 py-3 text-sm font-semibold text-[#010744] border-t border-gray-100">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </div>
      {values.map((v, i) => (
        <div
          key={`${label}-${i}`}
          className={`flex items-center gap-1.5 py-3 text-sm border-t border-gray-100 ${
            i === winnerIdx ? 'font-bold text-[#010744]' : 'text-gray-700'
          }`}
        >
          {v === '—' ? (
            <Minus size={12} className="text-gray-300" aria-hidden="true" />
          ) : (
            i === winnerIdx && (
              <Check size={12} className="text-emerald-600 shrink-0" strokeWidth={3} aria-hidden="true" />
            )
          )}
          <span>{v}</span>
        </div>
      ))}
    </>
  )
}
