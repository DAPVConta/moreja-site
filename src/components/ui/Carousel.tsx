'use client'

/**
 * Carousel — Embla Carousel wrapper
 *
 * Usage:
 * ```tsx
 * <Carousel options={{ loop: true }} autoplay={4000}>
 *   <CarouselItem>slide 1</CarouselItem>
 *   <CarouselItem>slide 2</CarouselItem>
 * </Carousel>
 * // Controls rendered wherever you want:
 * const { scrollPrev, scrollNext, selectedIndex } = useCarousel()
 * <CarouselPrev /> / <CarouselNext /> / <CarouselDots /> / <CarouselProgress />
 * ```
 */

import * as React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import type { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Context ────────────────────────────────────────────────────────────────

interface CarouselContextValue {
  emblaRef: (node: HTMLElement | null) => void
  emblaApi: EmblaCarouselType | undefined
  selectedIndex: number
  scrollSnaps: number[]
  canScrollPrev: boolean
  canScrollNext: boolean
  scrollPrev: () => void
  scrollNext: () => void
  scrollTo: (index: number) => void
  /** Progress 0–1 within the current autoplay tick. null when no autoplay. */
  autoplayProgress: number | null
  autoplayDelay: number | null
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

export function useCarousel(): CarouselContextValue {
  const ctx = React.useContext(CarouselContext)
  if (!ctx) throw new Error('useCarousel must be used inside <Carousel>')
  return ctx
}

// ─── Root ────────────────────────────────────────────────────────────────────

export interface CarouselProps {
  /** Embla options (loop, align, slidesToScroll, etc.) */
  options?: EmblaOptionsType
  /** Autoplay delay in ms. Omit to disable autoplay. */
  autoplay?: number
  /** Class applied to the root <section> element. */
  className?: string
  /** Accessible label for the carousel region. */
  ariaLabel?: string
  children: React.ReactNode
}

export function Carousel({
  options,
  autoplay: autoplayDelay,
  className,
  ariaLabel = 'Carrossel',
  children,
}: CarouselProps) {
  // Respect prefers-reduced-motion: disable autoplay
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const plugins = React.useMemo(() => {
    if (autoplayDelay == null || prefersReduced) return []
    return [
      Autoplay({
        delay: autoplayDelay,
        stopOnMouseEnter: true,
        stopOnInteraction: false,
        playOnInit: true,
      }),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplayDelay, prefersReduced])

  const [emblaRef, emblaApi] = useEmblaCarousel(options ?? {}, plugins)

  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([])
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [autoplayProgress, setAutoplayProgress] = React.useState<number | null>(
    autoplayDelay != null && !prefersReduced ? 0 : null
  )

  const rafRef = React.useRef<number | null>(null)

  const updateState = React.useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap())
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
    setScrollSnaps(api.scrollSnapList())
  }, [])

  // Autoplay progress ring animation
  const tickProgress = React.useCallback(() => {
    if (emblaApi == null || autoplayDelay == null) return
    const autoplayPlugin = emblaApi.plugins()?.autoplay
    if (autoplayPlugin == null) return
    const timeUntilNext = autoplayPlugin.timeUntilNext()
    if (timeUntilNext == null) {
      setAutoplayProgress(0)
    } else {
      setAutoplayProgress(1 - timeUntilNext / autoplayDelay)
    }
    rafRef.current = requestAnimationFrame(tickProgress)
  }, [emblaApi, autoplayDelay])

  React.useEffect(() => {
    if (emblaApi == null) return
    updateState(emblaApi)
    emblaApi.on('select', updateState)
    emblaApi.on('reInit', updateState)
    return () => {
      emblaApi.off('select', updateState)
      emblaApi.off('reInit', updateState)
    }
  }, [emblaApi, updateState])

  React.useEffect(() => {
    if (autoplayDelay != null && !prefersReduced && emblaApi != null) {
      rafRef.current = requestAnimationFrame(tickProgress)
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [autoplayDelay, prefersReduced, emblaApi, tickProgress])

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = React.useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  )

  // Live region announcement
  const liveRef = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = `Slide ${selectedIndex + 1} de ${scrollSnaps.length}`
    }
  }, [selectedIndex, scrollSnaps.length])

  const ctx: CarouselContextValue = {
    emblaRef,
    emblaApi,
    selectedIndex,
    scrollSnaps,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
    scrollTo,
    autoplayProgress,
    autoplayDelay: autoplayDelay ?? null,
  }

  return (
    <CarouselContext.Provider value={ctx}>
      <section
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
      >
        {children}
        {/* Live region — politely announces slide changes */}
        <span
          ref={liveRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </section>
    </CarouselContext.Provider>
  )
}
Carousel.displayName = 'Carousel'

// ─── Viewport ────────────────────────────────────────────────────────────────

export interface CarouselViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Clip overflow. Default true. */
  overflow?: boolean
}

/**
 * The scrollable viewport. Attach this directly around your slides.
 */
export function CarouselViewport({
  overflow = true,
  className,
  children,
  ...props
}: CarouselViewportProps) {
  const { emblaRef } = useCarousel()
  return (
    <div
      // Embla needs cursor-grab on the viewport for drag feel
      className={cn(overflow && 'overflow-hidden', 'cursor-grab active:cursor-grabbing', className)}
      ref={emblaRef as React.RefCallback<HTMLDivElement>}
      {...props}
    >
      <div className="flex touch-pan-y backface-hidden">{children}</div>
    </div>
  )
}
CarouselViewport.displayName = 'CarouselViewport'

// ─── Item ────────────────────────────────────────────────────────────────────

export interface CarouselItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @deprecated — use `className="basis-[85%] sm:basis-1/2 lg:basis-1/3"`
   *  diretamente. Inline style aqui sobrescrevia classes responsive. */
  basis?: string
}

export function CarouselItem({ basis, className, ...props }: CarouselItemProps) {
  // Default basis 100% via className (Tailwind precisa estática). Consumer
  // passa overrides responsive via className: `basis-[85%] sm:basis-1/2
  // lg:basis-1/3`. Antes este componente forçava `style={{ flex: '0 0 ${basis}' }}`
  // inline → sobrescrevia QUALQUER class responsive por especificidade,
  // resultando em todos os breakpoints com o tamanho mobile.
  // O prop `basis` é mantido por backward-compat mas só aplica se className
  // NÃO tiver `basis-` (deixa as classes responsive vencerem).
  const hasBasisInClass = typeof className === 'string' && /\bbasis-/.test(className)
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn(
        'min-w-0 shrink-0 grow-0',
        !hasBasisInClass && 'basis-full',
        className,
      )}
      style={!hasBasisInClass && basis ? { flexBasis: basis } : undefined}
      {...props}
    />
  )
}
CarouselItem.displayName = 'CarouselItem'

// ─── Prev / Next buttons ──────────────────────────────────────────────────────

const navButtonBase =
  'inline-flex items-center justify-center rounded-full ' +
  'bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md ' +
  'text-[#010744] cursor-pointer select-none ' +
  'transition-all duration-200 ' +
  'hover:bg-[#010744] hover:text-white hover:border-[#010744] hover:shadow-[var(--shadow-xl)] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2 ' +
  'disabled:opacity-40 disabled:pointer-events-none ' +
  'active:scale-[0.95]'

export interface CarouselPrevProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg'
}

export function CarouselPrev({ size = 'md', className, ...props }: CarouselPrevProps) {
  const { scrollPrev, canScrollPrev } = useCarousel()
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20
  return (
    <button
      type="button"
      aria-label="Slide anterior"
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      className={cn(navButtonBase, sizeClass, className)}
      {...props}
    >
      <ChevronLeft size={iconSize} aria-hidden="true" />
    </button>
  )
}
CarouselPrev.displayName = 'CarouselPrev'

export function CarouselNext({ size = 'md', className, ...props }: CarouselPrevProps) {
  const { scrollNext, canScrollNext } = useCarousel()
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20
  return (
    <button
      type="button"
      aria-label="Próximo slide"
      disabled={!canScrollNext}
      onClick={scrollNext}
      className={cn(navButtonBase, sizeClass, className)}
      {...props}
    >
      <ChevronRight size={iconSize} aria-hidden="true" />
    </button>
  )
}
CarouselNext.displayName = 'CarouselNext'

// ─── Dots ─────────────────────────────────────────────────────────────────────

export interface CarouselDotsProps {
  /** 'navy' (default) | 'yellow' | 'white' */
  variant?: 'navy' | 'yellow' | 'white'
  className?: string
}

export function CarouselDots({ variant = 'navy', className }: CarouselDotsProps) {
  const { scrollSnaps, selectedIndex, scrollTo } = useCarousel()
  if (scrollSnaps.length <= 1) return null

  const activeColor =
    variant === 'yellow'
      ? 'bg-[#f2d22e]'
      : variant === 'white'
      ? 'bg-white'
      : 'bg-[#010744]'

  const inactiveColor =
    variant === 'white' ? 'bg-white/40 hover:bg-white/70' : 'bg-gray-300 hover:bg-gray-400'

  return (
    <div
      role="tablist"
      aria-label="Navegação do carrossel"
      className={cn('flex items-center justify-center gap-2', className)}
    >
      {scrollSnaps.map((_, idx) => {
        const isActive = idx === selectedIndex
        return (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Ir para slide ${idx + 1} de ${scrollSnaps.length}`}
            onClick={() => scrollTo(idx)}
            className="flex h-6 w-6 items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2 rounded-full"
          >
            <span
              className={cn(
                'block h-2 rounded-full transition-all duration-200',
                isActive ? cn('w-6', activeColor) : cn('w-2', inactiveColor)
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
CarouselDots.displayName = 'CarouselDots'

// ─── Progress ring ────────────────────────────────────────────────────────────

export interface CarouselProgressProps {
  /** Size in px. Default 40. */
  size?: number
  /** Stroke width in px. Default 3. */
  strokeWidth?: number
  /** 'yellow' (default) | 'white' */
  color?: 'yellow' | 'white'
  className?: string
}

/**
 * SVG ring that fills to indicate autoplay progress.
 * Only renders when autoplay is active.
 */
export function CarouselProgress({
  size = 40,
  strokeWidth = 3,
  color = 'yellow',
  className,
}: CarouselProgressProps) {
  const { autoplayProgress } = useCarousel()
  if (autoplayProgress === null) return null

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - autoplayProgress)
  const stroke = color === 'white' ? '#ffffff' : '#f2d22e'
  const trackStroke = color === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(242,210,46,0.2)'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('-rotate-90', className)}
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackStroke}
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 80ms linear' }}
      />
    </svg>
  )
}
CarouselProgress.displayName = 'CarouselProgress'
