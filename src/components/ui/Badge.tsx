import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
    'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[#010744] text-white',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        accent: 'bg-[#f2d22e] text-[#010744]',
        outline: 'border border-[#010744] text-[#010744]',
        destructive: 'bg-red-500 text-white',
        success: 'bg-emerald-500 text-white',
        warning: 'bg-orange-500 text-white',
        // Marca: "Pré-Lançamento", "Lançamento", "Exclusivo"
        launch: 'bg-[#010744] text-white uppercase tracking-wider',
        priceDrop: 'bg-red-500 text-white',
        new: 'bg-emerald-500 text-white',
        exclusive: 'bg-[#f2d22e] text-[#010744] uppercase tracking-wider',
      },
      size: {
        sm: 'px-2 py-0 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
