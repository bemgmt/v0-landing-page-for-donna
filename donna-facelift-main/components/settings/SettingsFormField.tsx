"use client"

import { ReactNode } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

interface SettingsFormFieldProps {
  name: string
  label: string
  description?: string
  tooltip?: string
  type?: "text" | "email" | "password" | "number" | "textarea" | "switch" | "checkbox" | "select" | "radio"
  placeholder?: string
  options?: { value: string; label: string }[]
  disabled?: boolean
  className?: string
  required?: boolean
  children?: ReactNode // For custom rendering
}

export function SettingsFormField({
  name,
  label,
  description,
  tooltip,
  type = "text",
  placeholder,
  options = [],
  disabled = false,
  className,
  required = false,
  children,
}: SettingsFormFieldProps) {
  const { control, formState: { errors } } = useFormContext()
  const error = errors[name]

  const renderField = () => {
    if (children) {
      return children
    }

    switch (type) {
      case "textarea":
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  "w-full glass border border-white/20 rounded px-4 py-2 text-white focus:outline-none focus:border-white/40 resize-none",
                  error && "border-red-500/50"
                )}
                rows={4}
              />
            )}
          />
        )

      case "switch":
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            )}
          />
        )

      case "checkbox":
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            )}
          />
        )

      case "select":
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => {
              // Ensure value is not empty string - convert to undefined if needed
              // Also handle null/undefined values properly
              const selectValue = (field.value === "" || field.value === null || field.value === undefined) ? undefined : field.value
              return (
                <Select
                  value={selectValue}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                <SelectTrigger className={cn(
                  "w-full glass border border-white/20 text-white",
                  error && "border-red-500/50"
                )}>
                  <SelectValue placeholder={placeholder || "Select an option"} />
                </SelectTrigger>
                <SelectContent>
                  {options
                    .filter((option) => option.value !== "") // Filter out empty string values
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              )
            }}
          />
        )

      case "radio":
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
                className="flex flex-col gap-3"
              >
                {options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                    <Label
                      htmlFor={`${name}-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        )

      default:
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  "w-full glass border border-white/20 rounded px-4 py-2 text-white focus:outline-none focus:border-white/40",
                  error && "border-red-500/50"
                )}
              />
            )}
          />
        )
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-4 h-4 text-white/40 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {description && (
        <p className="text-xs text-white/60">{description}</p>
      )}
      {renderField()}
      {error && (
        <p className="text-xs text-red-400">{error.message as string}</p>
      )}
    </div>
  )
}
