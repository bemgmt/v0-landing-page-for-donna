"use client"

import { AlertTriangle, Circle, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PriorityLevel } from "@/types/email"

interface PriorityIndicatorProps {
  priority: PriorityLevel
  onPriorityChange?: (priority: PriorityLevel) => void
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  className?: string
}

const PRIORITY_CONFIG = {
  high: {
    label: 'High Priority',
    color: 'text-red-500 bg-red-50 border-red-200',
    icon: AlertTriangle,
    badgeVariant: 'destructive' as const,
    description: 'Requires immediate attention'
  },
  medium: {
    label: 'Medium Priority',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: Circle,
    badgeVariant: 'secondary' as const,
    description: 'Normal priority level'
  },
  low: {
    label: 'Low Priority',
    color: 'text-blue-500 bg-blue-50 border-blue-200',
    icon: Circle,
    badgeVariant: 'outline' as const,
    description: 'Can be handled when convenient'
  },
  none: {
    label: 'No Priority',
    color: 'text-gray-400 bg-gray-50 border-gray-200',
    icon: Minus,
    badgeVariant: 'outline' as const,
    description: 'No specific priority assigned'
  }
}

const SIZE_CONFIG = {
  sm: {
    icon: 'h-3 w-3',
    badge: 'h-5 px-1.5 text-xs',
    button: 'h-6 w-6 p-0'
  },
  md: {
    icon: 'h-4 w-4',
    badge: 'h-6 px-2 text-sm',
    button: 'h-8 w-8 p-0'
  },
  lg: {
    icon: 'h-5 w-5',
    badge: 'h-7 px-3 text-sm',
    button: 'h-10 w-10 p-0'
  }
}

export function PriorityIndicator({
  priority,
  onPriorityChange,
  showLabel = false,
  size = 'md',
  interactive = false,
  className
}: PriorityIndicatorProps) {
  const config = PRIORITY_CONFIG[priority]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  const handlePriorityChange = (newPriority: PriorityLevel) => {
    if (onPriorityChange) {
      onPriorityChange(newPriority)
    }
  }

  const PriorityDisplay = () => (
    <div className={cn("flex items-center gap-1", className)}>
      <Icon className={cn(sizeConfig.icon, config.color.split(' ')[0])} />
      {showLabel && (
        <Badge variant={config.badgeVariant} className={sizeConfig.badge}>
          {config.label}
        </Badge>
      )}
    </div>
  )

  if (!interactive || !onPriorityChange) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex">
              <PriorityDisplay />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">{config.label}</div>
              <div className="text-xs text-muted-foreground">{config.description}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(sizeConfig.button, "hover:bg-muted", className)}
        >
          <Icon className={cn(sizeConfig.icon, config.color.split(' ')[0])} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Set Priority</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {(Object.entries(PRIORITY_CONFIG) as [PriorityLevel, typeof PRIORITY_CONFIG[PriorityLevel]][]).map(([level, levelConfig]) => {
          const LevelIcon = levelConfig.icon
          const isSelected = priority === level
          
          return (
            <DropdownMenuItem
              key={level}
              onClick={() => handlePriorityChange(level)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <LevelIcon className={cn("h-4 w-4", levelConfig.color.split(' ')[0])} />
                <div className="flex flex-col">
                  <span className="text-sm">{levelConfig.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {levelConfig.description}
                  </span>
                </div>
              </div>
              {isSelected && (
                <Circle className="h-2 w-2 fill-current" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Utility component for sorting by priority
export function PrioritySortButton({
  currentSort,
  onSortChange,
  className
}: {
  currentSort: 'date' | 'priority' | 'category'
  onSortChange: (sort: 'date' | 'priority' | 'category') => void
  className?: string
}) {
  return (
    <Button
      variant={currentSort === 'priority' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onSortChange('priority')}
      className={cn("h-8", className)}
    >
      <AlertTriangle className="h-4 w-4 mr-1" />
      Priority
    </Button>
  )
}

// Utility function to get priority order for sorting
export function getPriorityOrder(priority: PriorityLevel): number {
  const order = {
    high: 3,
    medium: 2,
    low: 1,
    none: 0
  }
  return order[priority]
}

// Utility function to get priority color classes
export function getPriorityColorClasses(priority: PriorityLevel) {
  return PRIORITY_CONFIG[priority].color
}

// Utility function to detect priority from email content
export function detectEmailPriority(subject: string, body: string): PriorityLevel {
  const content = (subject + ' ' + body).toLowerCase()
  
  // High priority keywords
  const highPriorityKeywords = [
    'urgent', 'asap', 'emergency', 'critical', 'immediate',
    'deadline', 'time sensitive', 'action required', 'important'
  ]
  
  // Low priority keywords
  const lowPriorityKeywords = [
    'fyi', 'for your information', 'newsletter', 'update',
    'notification', 'reminder'
  ]
  
  if (highPriorityKeywords.some(keyword => content.includes(keyword))) {
    return 'high'
  }
  
  if (lowPriorityKeywords.some(keyword => content.includes(keyword))) {
    return 'low'
  }
  
  return 'medium'
}
