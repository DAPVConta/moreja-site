import * as React from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        'animate-pulse rounded-md bg-gray-200/80',
        '[&>*]:invisible',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
