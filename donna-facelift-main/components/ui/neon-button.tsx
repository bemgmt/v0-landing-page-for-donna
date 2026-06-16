import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const neonButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default: "donna-btn donna-hover",
        glass: "donna-btn-glass donna-hover",
        outline: "donna-btn-glass border-2 border-donna-purple/50 hover:border-donna-purple donna-hover donna-gradient-border",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1.5 text-sm",
        lg: "px-6 py-3 text-lg",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface NeonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neonButtonVariants> {
  asChild?: boolean
}

function NeonButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: NeonButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(neonButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { NeonButton, neonButtonVariants }
