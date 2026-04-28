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
