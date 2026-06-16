"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SettingsSectionWrapperProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export default function SettingsSectionWrapper({
  title,
  description,
  children,
  className,
}: SettingsSectionWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("space-y-6", className)}
    >
      <div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-white/60 mb-4">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  )
}
