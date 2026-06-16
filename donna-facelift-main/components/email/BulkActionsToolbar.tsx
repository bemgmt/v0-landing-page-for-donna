"use client"

import { useState } from "react"
import { 
  Archive, 
  Star, 
  StarOff, 
  Mail, 
  MailOpen, 
  Template, 
  Users, 
  Tag, 
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  Minus,
  Undo2,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { BulkActionType, EmailCategory, PriorityLevel, BulkOperationParameters } from "@/types/email"

interface BulkActionsToolbarProps {
  selectedCount: number
  totalCount: number
  isAllSelected: boolean
  isPartiallySelected: boolean
  onSelectAll: () => void
  onSelectNone: () => void
  onBulkAction: (action: BulkActionType, parameters?: BulkOperationParameters) => Promise<void>
  onUndo?: () => void
  canUndo?: boolean
  isProcessing?: boolean
  templates?: Array<{ id: string; name: string; template_type: string }>
  campaigns?: Array<{ id: string; name: string; status: string }>
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  isAllSelected,
  isPartiallySelected,
  onSelectAll,
  onSelectNone,
  onBulkAction,
  onUndo,
  canUndo = false,
  isProcessing = false,
  templates = [],
  campaigns = []
}: BulkActionsToolbarProps) {
  const [confirmAction, setConfirmAction] = useState<{
    action: BulkActionType
    title: string
    description: string
    parameters?: BulkOperationParameters
  } | null>(null)

  const handleAction = async (action: BulkActionType, parameters?: BulkOperationParameters) => {
    // Actions that need confirmation
    const destructiveActions: BulkActionType[] = ['archive']
    
    if (destructiveActions.includes(action)) {
      setConfirmAction({
        action,
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} ${selectedCount} emails?`,
        description: `This will ${action} ${selectedCount} selected email${selectedCount > 1 ? 's' : ''}. This action can be undone.`,
        parameters
      })
      return
    }

    try {
      await onBulkAction(action, parameters)
      toast({
        title: "Bulk Action Complete",
        description: `Successfully applied ${action} to ${selectedCount} email${selectedCount > 1 ? 's' : ''}.`
      })
    } catch (error) {
      toast({
        title: "Bulk Action Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    }
  }

  const handleConfirmedAction = async () => {
    if (!confirmAction) return

    try {
      await onBulkAction(confirmAction.action, confirmAction.parameters)
      toast({
        title: "Bulk Action Complete",
        description: `Successfully applied ${confirmAction.action} to ${selectedCount} email${selectedCount > 1 ? 's' : ''}.`
      })
    } catch (error) {
      toast({
        title: "Bulk Action Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    } finally {
      setConfirmAction(null)
    }
  }

  const getSelectionIcon = () => {
    if (isAllSelected) return CheckSquare
    if (isPartiallySelected) return Minus
    return Square
  }

  const SelectionIcon = getSelectionIcon()

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
        <div className="flex items-center gap-3">
          {/* Selection Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isAllSelected ? onSelectNone : onSelectAll}
              className="h-8 w-8 p-0"
            >
              <SelectionIcon className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="text-xs">
              {selectedCount} of {totalCount} selected
            </Badge>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Archive */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('archive')}
              disabled={isProcessing}
              className="h-8 px-2"
            >
              <Archive className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Archive</span>
            </Button>

            {/* Star/Unstar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isProcessing} className="h-8 px-2">
                  <Star className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Star</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleAction('star')}>
                  <Star className="h-4 w-4 mr-2" />
                  Add Star
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('unstar')}>
                  <StarOff className="h-4 w-4 mr-2" />
                  Remove Star
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Apply Template */}
            {templates.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isProcessing} className="h-8 px-2">
                    <Template className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Template</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Apply Template</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {templates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => handleAction('apply_template', { template_id: template.id })}
                    >
                      <Template className="h-4 w-4 mr-2" />
                      <div className="flex flex-col">
                        <span className="text-sm">{template.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {template.template_type}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Add to Campaign */}
            {campaigns.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isProcessing} className="h-8 px-2">
                    <Users className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Campaign</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Add to Campaign</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {campaigns.filter(c => c.status === 'active' || c.status === 'draft').map((campaign) => (
                    <DropdownMenuItem
                      key={campaign.id}
                      onClick={() => handleAction('add_to_campaign', { campaign_id: campaign.id })}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      <div className="flex flex-col">
                        <span className="text-sm">{campaign.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {campaign.status}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Set Category */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isProcessing} className="h-8 px-2">
                  <Tag className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Category</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Set Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['marketing', 'sales', 'support', 'personal'] as EmailCategory[]).map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => handleAction('set_category', { category })}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    <span className="capitalize">{category}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Set Priority */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isProcessing} className="h-8 px-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Priority</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Set Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['high', 'medium', 'low', 'none'] as PriorityLevel[]).map((priority) => (
                  <DropdownMenuItem
                    key={priority}
                    onClick={() => handleAction('set_priority', { priority_level: priority })}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="capitalize">{priority}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo Button */}
          {canUndo && onUndo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={isProcessing}
              className="h-8 px-2"
            >
              <Undo2 className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Undo</span>
            </Button>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Processing...</span>
            </div>
          )}

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectNone}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedAction}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
