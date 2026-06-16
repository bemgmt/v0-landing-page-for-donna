import * as React from "react"
import { cn } from "@/lib/utils"

type FuturisticInputProps = React.InputHTMLAttributes<HTMLInputElement>

const FuturisticInput = React.forwardRef<HTMLInputElement, FuturisticInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "donna-input",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
FuturisticInput.displayName = "FuturisticInput"

export { FuturisticInput }
