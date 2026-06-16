"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { VerticalOption } from "@/lib/constants/verticals"
import { Check } from "lucide-react"

interface VerticalOptionCardProps {
  vertical: VerticalOption
  isSelected: boolean
  onSelect: () => void
}

export function VerticalOptionCard({ vertical, isSelected, onSelect }: VerticalOptionCardProps) {
  return (
    <Card
      variant="glass"
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-[1.02]",
        "border-2",
        isSelected
          ? "border-donna-purple-DEFAULT shadow-[0_0_20px_rgba(165,107,255,0.4)] bg-white/10"
          : "border-white/10 hover:border-donna-cyan-DEFAULT/50 hover:shadow-[0_0_15px_rgba(49,210,242,0.3)]"
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl font-semibold text-white">
            {vertical.label}
          </CardTitle>
          {isSelected && (
            <div className="rounded-full bg-donna-purple-DEFAULT p-1.5">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-white/70 text-sm leading-relaxed">
          {vertical.description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}

