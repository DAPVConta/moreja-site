// Barrel — primitivos shadcn-like do site público.
// Coexistem com utility classes legadas (.btn-primary, .property-card, etc) em globals.css.

export { Button, buttonVariants, type ButtonProps } from './Button'
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './Card'
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './Dialog'
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
} from './Sheet'
export { Input, type InputProps } from './Input'
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
} from './Select'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'
export { Badge, badgeVariants, type BadgeProps } from './Badge'
export { Skeleton } from './Skeleton'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './Tooltip'

// ── Phase 0 cross-block utilities ──────────────────────────────────────────
export {
  Carousel,
  CarouselItem,
  CarouselViewport,
  CarouselPrev,
  CarouselNext,
  CarouselDots as CarouselDotsEmbla,
  CarouselProgress,
  useCarousel,
  type CarouselProps,
  type CarouselItemProps,
  type CarouselViewportProps,
  type CarouselPrevProps,
} from './Carousel'

export {
  AnimatedChip,
  type AnimatedChipProps,
} from './AnimatedChip'

export {
  MagneticButton,
  type MagneticButtonProps,
} from './MagneticButton'

// Note: mesh gradient classes (.bg-mesh-cream, .bg-mesh-navy, .bg-mesh-white)
// and the .animated-chip-pulse keyframe live in src/app/globals.css — use them
// as plain Tailwind utility strings, no JS import needed.
