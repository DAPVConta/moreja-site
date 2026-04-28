'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base — tap target 44px+, focus visible, motion polish
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ' +
    'select-none cursor-pointer transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ' +
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[#f2d22e] text-[#010744] shadow-[0_8px_24px_-6px_rgb(242_210_46_/_0.40)] ' +
          'hover:brightness-105 hover:shadow-[0_12px_32px_-6px_rgb(242_210_46_/_0.55)] ' +
          'active:brightness-95 focus-visible:ring-[#f2d22e]',
        secondary:
          'bg-[#010744] text-white hover:bg-[#0a1a6e] active:bg-[#000533] ' +
          'focus-visible:ring-[#010744]',
        outline:
          'border-2 border-[#010744] bg-transparent text-[#010744] ' +
          'hover:bg-[#010744] hover:text-white focus-visible:ring-[#010744]',
        ghost:
          'bg-transparent text-[#010744] hover:bg-[#010744]/5 active:bg-[#010744]/10 ' +
          'focus-visible:ring-[#010744]',
        link:
          'bg-transparent text-[#010744] underline-offset-4 hover:underline ' +
          'focus-visible:ring-[#010744] active:scale-100',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
          'focus-visible:ring-red-600',
      },
      size: {
        sm: 'min-h-[36px] rounded-md px-3 text-sm [&_svg]:h-4 [&_svg]:w-4',
        md: 'min-h-[44px] rounded-lg px-6 text-sm [&_svg]:h-4 [&_svg]:w-4',
        lg: 'min-h-[52px] rounded-lg px-8 text-base [&_svg]:h-5 [&_svg]:w-5',
        xl: 'min-h-[60px] rounded-xl px-10 text-lg [&_svg]:h-5 [&_svg]:w-5',
        icon: 'h-11 w-11 rounded-lg [&_svg]:h-5 [&_svg]:w-5',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
