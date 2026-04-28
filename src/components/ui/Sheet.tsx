'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[var(--z-modal)] bg-black/60 backdrop-blur-sm ' +
        'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const sheetVariants = cva(
  'fixed z-[var(--z-modal)] gap-4 bg-[var(--surface-0)] shadow-xl ' +
    'transition ease-in-out ' +
    'data-[state=closed]:duration-200 data-[state=open]:duration-300 ' +
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
  {
    variants: {
      side: {
        top:
          'inset-x-0 top-0 border-b ' +
          'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 rounded-t-2xl border-t ' +
          'pb-[env(safe-area-inset-bottom)] ' +
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left:
          'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r ' +
          'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        right:
          'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l ' +
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
      },
    },
    defaultVariants: { side: 'bottom' },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  hideClose?: boolean
  /** Quando `true` no side="bottom", limita altura a 90dvh com scroll interno. */
  maxHeight?: boolean
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'bottom', maxHeight = true, hideClose, className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        sheetVariants({ side }),
        side === 'bottom' && maxHeight && 'max-h-[90dvh] overflow-y-auto',
        'p-6',
        className
      )}
      {...props}
    >
      {/* Drag indicator no side="bottom" — visual cue de "deslize para cima/baixo" */}
      {side === 'bottom' && (
        <div
          aria-hidden="true"
          className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--border-strong)]"
        />
      )}
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-md p-1 text-[var(--text-muted)] transition-colors
                     hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744]"
        >
          <X className="h-5 w-5" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5', className)} {...props} />
)

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'sticky bottom-0 -mx-6 -mb-6 mt-4 flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] ' +
        'bg-[var(--surface-0)] px-6 pb-6 pt-4 sm:flex-row sm:justify-end',
      className
    )}
    {...props}
  />
)

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-bold tracking-tight text-[var(--text-primary)]', className)}
    {...props}
  />
))
SheetTitle.displayName = DialogPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--text-secondary)]', className)}
    {...props}
  />
))
SheetDescription.displayName = DialogPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
