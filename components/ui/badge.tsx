import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/15 text-destructive border-destructive/20 dark:bg-destructive/20",
        outline:
          "text-foreground border-border",
        success:
          "border-emerald-500/20 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/20",
        warning:
          "border-amber-500/20 bg-amber-500/15 text-amber-700 dark:text-amber-300 dark:bg-amber-500/20",
        info:
          "border-sky-500/20 bg-sky-500/15 text-sky-700 dark:text-sky-300 dark:bg-sky-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
