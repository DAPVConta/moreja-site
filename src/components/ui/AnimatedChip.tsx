/**
 * AnimatedChip — eyebrow label with optional gold ring pulse.
 *
 * Usage:
 * ```tsx
 * import { AnimatedChip } from '@/components/ui'
 * import { Sparkles } from 'lucide-react'
 *
 * // Gold (default) — on white/cream backgrounds
 * <AnimatedChip icon={Sparkles}>Lançamentos</AnimatedChip>
 *
 * // Navy — on yellow or cream
 * <AnimatedChip variant="navy">Destaques</AnimatedChip>
 *
 * // Ghost — on dark/navy backgrounds
 * <AnimatedChip variant="ghost" pulse={false}>Sobre nós</AnimatedChip>
 * ```
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const chipVariants = cva(
  // Base
  'inline-flex items-center gap-1.5 ' +
    'px-3 py-1.5 rounded-full ' +
    'text-xs font-bold uppercase tracking-[0.2em] ' +
    'select-none whitespace-nowrap',
  {
    variants: {
      variant: {
        gold: 'bg-[#f2d22e]/15 text-[#010744] ring-1 ring-[#f2d22e]/40',
        navy: 'bg-[#010744] text-white ring-1 ring-white/10',
        ghost: 'bg-white/8 text-white/90 ring-1 ring-white/15',
      },
    },
    defaultVariants: { variant: 'gold' },
  }
)

export interface AnimatedChipProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof chipVariants> {
  icon?: LucideIcon
  /** Enable the gold ring pulse animation. Default true. Automatically disabled for prefers-reduced-motion. */
  pulse?: boolean
  /** Root element tag. Default 'span'. */
  as?: 'span' | 'div'
}

export function AnimatedChip({
  icon: Icon,
  variant = 'gold',
  pulse = true,
  as: Tag = 'span',
  className,
  children,
  ...props
}: AnimatedChipProps) {
  return (
    <Tag
      className={cn(
        chipVariants({ variant }),
        // The pulse CSS animation is defined in globals.css as @keyframes chip-pulse.
        // The `animated-chip-pulse` class applies it; prefers-reduced-motion is handled
        // via the global `@media (prefers-reduced-motion: reduce)` rule in globals.css
        // which sets animation-duration to 0.01ms, effectively disabling it.
        pulse && 'animated-chip-pulse',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {children}
    </Tag>
  )
}
AnimatedChip.displayName = 'AnimatedChip'
