"use client"

import { useState } from "react"
import { Check, ChevronDown, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmailCategory } from "@/types/email"

interface CategoryFilterProps {
  selectedCategory: EmailCategory | 'all'
  onCategoryChange: (category: EmailCategory | 'all') => void
  categoryStats?: Record<string, number>
  customCategories?: string[]
  onAddCategory?: (category: string) => void
  onRemoveCategory?: (category: string) => void
}

const DEFAULT_CATEGORIES: { value: EmailCategory | 'all'; label: string; color: string; icon: string }[] = [
  { value: 'all', label: 'All', color: 'bg-gray-500', icon: '📧' },
  { value: 'marketing', label: 'Marketing', color: 'bg-blue-500', icon: '📈' },
  { value: 'sales', label: 'Sales', color: 'bg-green-500', icon: '💰' },
  { value: 'support', label: 'Support', color: 'bg-orange-500', icon: '🛠️' },
  { value: 'personal', label: 'Personal', color: 'bg-purple-500', icon: '👤' },
  { value: 'unread', label: 'Unread', color: 'bg-red-500', icon: '🔴' },
]

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  categoryStats = {},
  customCategories = [],
  onAddCategory,
  onRemoveCategory
}: CategoryFilterProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.map(cat => ({
      value: cat as EmailCategory,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      color: 'bg-gray-600',
      icon: '🏷️'
    }))
  ]

  const selectedCategoryData = allCategories.find(cat => cat.value === selectedCategory)

  const handleAddCategory = () => {
    if (newCategoryName.trim() && onAddCategory) {
      onAddCategory(newCategoryName.trim().toLowerCase())
      setNewCategoryName('')
      setIsAddDialogOpen(false)
    }
  }

  const handleRemoveCategory = (category: string) => {
    if (onRemoveCategory) {
      onRemoveCategory(category)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 px-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">{selectedCategoryData?.icon}</span>
              <span className="text-sm font-medium">
                {selectedCategoryData?.label || 'All'}
              </span>
              {categoryStats[selectedCategory] !== undefined && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {categoryStats[selectedCategory]}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {DEFAULT_CATEGORIES.map((category) => (
            <DropdownMenuItem
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{category.icon}</span>
                <span>{category.label}</span>
                {selectedCategory === category.value && (
                  <Check className="h-4 w-4" />
                )}
              </div>
              {categoryStats[category.value] !== undefined && (
                <Badge variant="outline" className="h-5 px-1.5 text-xs">
                  {categoryStats[category.value]}
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
          
          {customCategories.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Custom Categories</DropdownMenuLabel>
              {customCategories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => onCategoryChange(category as EmailCategory)}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏷️</span>
                    <span className="capitalize">{category}</span>
                    {selectedCategory === category && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {categoryStats[category] !== undefined && (
                      <Badge variant="outline" className="h-5 px-1.5 text-xs">
                        {categoryStats[category]}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveCategory(category)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          {onAddCategory && (
            <>
              <DropdownMenuSeparator />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Custom Category</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Custom Category</DialogTitle>
                    <DialogDescription>
                      Create a new category to organize your emails.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="category-name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., newsletters, invoices"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCategory()
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      Add Category
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Category Statistics Summary */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        {Object.entries(categoryStats).length > 0 && (
          <span>
            Total: {Object.values(categoryStats).reduce((sum, count) => sum + count, 0)}
          </span>
        )}
      </div>
    </div>
  )
}
