'use client'

/**
 * Select nativo de ordenação (mobile). Extraído do PropertyGrid (Server
 * Component): `onChange` num elemento renderizado por RSC não pode ser
 * serializado — quebrava a navegação de busca em /comprar e /alugar com
 * "Event handlers cannot be passed to Client Component props".
 * As URLs chegam prontas do servidor; aqui só disparamos a navegação.
 */
export function OrderSelectMobile({
  active,
  options,
}: {
  active: string
  options: { value: string; label: string; href: string }[]
}) {
  return (
    <label className="sm:hidden flex items-center gap-2 text-sm text-gray-600">
      <span className="whitespace-nowrap">Ordenar:</span>
      <select
        value={active}
        onChange={(e) => {
          const opt = options.find((o) => o.value === e.target.value)
          if (opt) window.location.href = opt.href
        }}
        className="flex-1 min-w-0 px-3 py-2.5 text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010744]"
        aria-label="Ordenar imóveis"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  )
}
