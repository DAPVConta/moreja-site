'use client'

/**
 * MagneticButton — button/anchor with subtle magnetic hover effect via Framer Motion.
 *
 * On desktop (pointer: fine) the element gently follows the cursor up to `strength`
 * pixels. On touch/coarse-pointer devices and when `prefers-reduced-motion` is set,
 * the magnetic effect is disabled and it renders as a plain button.
 *
 * @example Gold CTA
 * ```tsx
 * import { MagneticButton } from '@/components/ui'
 *
 * <MagneticButton variant="gold" size="lg" onClick={handleCTA}>
 *   Buscar imóvel
 * </MagneticButton>
 * ```
 *
 * @example As an anchor link
 * ```tsx
 * <MagneticButton as="a" href="/comprar" variant="navy" size="md">
 *   Ver imóveis
 * </MagneticButton>
 * ```
 *
 * @example Ghost outline
 * ```tsx
 * <MagneticButton variant="ghost" size="sm">
 *   Saiba mais
 * </MagneticButton>
 * ```
 */

import * as React from 'react'
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ─── Variants ────────────────────────────────────────────────────────────────

const magneticButtonVariants = cva(
  // Base — shared with Button primitive; min 44px tap target
  'relative inline-flex items-center justify-center gap-2 ' +
    'font-semibold cursor-pointer select-none whitespace-nowrap ' +
    'transition-[box-shadow,filter] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2 ' +
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ' +
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        gold:
          'bg-[#f2d22e] text-[#010744] rounded-xl ' +
          'shadow-[0_8px_24px_-6px_rgb(242_210_46_/_0.40)] ' +
          'hover:brightness-105 hover:shadow-[0_12px_32px_-6px_rgb(242_210_46_/_0.55)]',
        navy:
          'bg-[#010744] text-white rounded-xl ' +
          'shadow-[0_8px_24px_-6px_rgb(1_7_68_/_0.25)] ' +
          'hover:bg-[#0a1a6e] hover:shadow-[0_12px_32px_-6px_rgb(1_7_68_/_0.35)]',
        ghost:
          'bg-transparent border-2 border-current text-[#010744] rounded-xl ' +
          'hover:bg-[#010744]/5',
      },
      size: {
        sm: 'min-h-[36px] px-4 py-2 text-sm rounded-lg [&_svg]:h-4 [&_svg]:w-4',
        md: 'min-h-[44px] px-6 py-3 text-sm [&_svg]:h-4 [&_svg]:w-4',
        lg: 'min-h-[52px] px-8 py-3.5 text-base [&_svg]:h-5 [&_svg]:w-5',
      },
    },
    defaultVariants: { variant: 'gold', size: 'md' },
  }
)

// ─── Props ────────────────────────────────────────────────────────────────────

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a'; href?: string }
type ButtonNativeProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }

export type MagneticButtonProps = (AnchorProps | ButtonNativeProps) &
  VariantProps<typeof magneticButtonVariants> & {
    /**
     * Maximum translation in px (magnetic pull strength).
     * Default 7. Set to 0 to disable magnetic effect while keeping variants.
     */
    strength?: number
    /** Extra class name merged last */
    className?: string
    children?: React.ReactNode
  }

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Use `as="a"` + `href` to render an `<a>` anchor instead of `<button>`.
 */
export function MagneticButton({
  as,
  variant,
  size,
  strength = 7,
  className,
  children,
  ...rest
}: MagneticButtonProps) {
  const containerRef = React.useRef<HTMLElement>(null)

  // Detect devices where we should skip the magnetic effect
  const [isMagnetic, setIsMagnetic] = React.useState(false)

  React.useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setIsMagnetic(!coarsePointer && !reducedMotion && strength > 0)
  }, [strength])

  // Spring-smoothed motion values for x / y
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 150, damping: 15, mass: 0.1 })
  const y = useSpring(rawY, { stiffness: 150, damping: 15, mass: 0.1 })

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!isMagnetic || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      // Normalise to [-1, 1] then multiply by strength
      rawX.set(((e.clientX - centerX) / (rect.width / 2)) * strength)
      rawY.set(((e.clientY - centerY) / (rect.height / 2)) * strength)
    },
    [isMagnetic, rawX, rawY, strength]
  )

  const handleMouseLeave = React.useCallback(() => {
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  const baseClass = cn(magneticButtonVariants({ variant, size }), className)

  // Shared motion props — only apply spring style when magnetic is active
  const motionStyle = isMagnetic ? { x, y } : {}

  if (as === 'a') {
    const { href, ...anchorRest } = rest as AnchorProps
    return (
      <motion.a
        ref={containerRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        style={motionStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={baseClass}
        {...(anchorRest as HTMLMotionProps<'a'>)}
      >
        {children}
      </motion.a>
    )
  }

  const { type = 'button', ...buttonRest } = rest as ButtonNativeProps

  return (
    <motion.button
      ref={containerRef as React.RefObject<HTMLButtonElement>}
      type={type}
      style={motionStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={baseClass}
      {...(buttonRest as HTMLMotionProps<'button'>)}
    >
      {children}
    </motion.button>
  )
}

MagneticButton.displayName = 'MagneticButton'
