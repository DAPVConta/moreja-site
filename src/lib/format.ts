/**
 * Pure formatters — safe to import from client components.
 * Mantemos separado de `properties.ts` porque aquele arquivo importa
 * `supabase-server` (next/headers) que é Server-only.
 */

// Coerce p/ Number(): string vinda do CRM ("1200000.00"), null/undefined,
// NaN — qualquer coisa não-finita vira 0, evitando crash em RSC quando
// um campo opcional do Property chega como string ou ausente.
function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function formatPrice(value: number | string | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeNumber(value))
}

export function formatArea(value: number | string | null | undefined): string {
  return `${safeNumber(value).toLocaleString('pt-BR')} m²`
}
