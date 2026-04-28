/**
 * Pure formatters — safe to import from client components.
 * Mantemos separado de `properties.ts` porque aquele arquivo importa
 * `supabase-server` (next/headers) que é Server-only.
 */

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatArea(value: number): string {
  return `${value.toLocaleString('pt-BR')} m²`
}
