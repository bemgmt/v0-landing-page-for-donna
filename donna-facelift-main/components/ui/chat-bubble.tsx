import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "donna" | "user"
  children: React.ReactNode
}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(function ChatBubble({
  className, 
  variant = "donna",
  children,
  ...props 
}, ref) {
  const variantClasses = {
    donna: "bubble-donna",
    user: "bubble-user"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        variantClasses[variant],
        "donna-message",
        variant === "donna" && "donna-glow",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </motion.div>
  )
})

ChatBubble.displayName = "ChatBubble"

export { ChatBubble }
