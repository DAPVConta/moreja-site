import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classes Tailwind eliminando conflitos (ex: "px-2 px-4" → "px-4").
 * Padrão shadcn/ui — usado em todos os primitivos de src/components/ui.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
