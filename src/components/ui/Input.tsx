import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Ícone à esquerda do input. Use lucide-react ou outro componente. */
  startIcon?: React.ReactNode
  /** Ícone à direita do input (ex: botão de limpar, dropdown chevron). */
  endIcon?: React.ReactNode
  invalid?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', startIcon, endIcon, invalid, ...props }, ref) => {
    if (startIcon || endIcon) {
      return (
        <div className="relative">
          {startIcon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            >
              {startIcon}
            </span>
          )}
          <input
            ref={ref}
            type={type}
            data-invalid={invalid || undefined}
            aria-invalid={invalid || undefined}
            className={cn(
              'flex h-12 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] ' +
                'px-3 py-2 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
                'transition-colors ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744] focus-visible:border-[#010744] ' +
                'disabled:cursor-not-allowed disabled:opacity-60 ' +
                'data-[invalid]:border-red-500 data-[invalid]:focus-visible:ring-red-500',
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {endIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {endIcon}
            </span>
          )}
        </div>
      )
    }

    return (
      <input
        ref={ref}
        type={type}
        data-invalid={invalid || undefined}
        aria-invalid={invalid || undefined}
        className={cn(
          'flex h-12 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] ' +
            'px-3 py-2 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
            'transition-colors ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744] focus-visible:border-[#010744] ' +
            'disabled:cursor-not-allowed disabled:opacity-60 ' +
            'data-[invalid]:border-red-500 data-[invalid]:focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
