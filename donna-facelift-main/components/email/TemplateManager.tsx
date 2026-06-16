"use client"

import { useState, useMemo } from "react"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Download, 
  Upload,
  Filter,
  Star,
  StarOff,
  Folder,
  FolderOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEmailTemplates } from "@/hooks/useEmailTemplates"
import { EmailTemplate, TemplateFormData } from "@/types/email"
import { extractTemplateVariables, replaceTemplateVariables } from "@/lib/email-utils"
import { toast } from "@/hooks/use-toast"

interface TemplateManagerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onTemplateSelect?: (template: EmailTemplate) => void
  onTemplateInsert?: (template: EmailTemplate) => void
}

export function TemplateManager({
  isOpen,
  onOpenChange,
  onTemplateSelect,
  onTemplateInsert
}: TemplateManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'personal' | 'campaign'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({})

  const {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    exportTemplates
  } = useEmailTemplates({ templateType: 'all' })

  // Filter templates based on search and type
  const filteredTemplates = useMemo(() => {
    let filtered = templates

    if (selectedType !== 'all') {
      filtered = filtered.filter(template => template.template_type === selectedType)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.subject_template.toLowerCase().includes(query) ||
        template.body_template.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [templates, selectedType, searchQuery])

  // Group templates by type
  const groupedTemplates = useMemo(() => {
    const groups = {
      personal: filteredTemplates.filter(t => t.template_type === 'personal'),
      campaign: filteredTemplates.filter(t => t.template_type === 'campaign')
    }
    return groups
  }, [filteredTemplates])

  const handleCreateTemplate = async (data: TemplateFormData) => {
    try {
      await createTemplate(data)
      setIsCreateDialogOpen(false)
      toast({
        title: "Template Created",
        description: `Template "${data.name}" has been created successfully.`
      })
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleUpdateTemplate = async (data: Partial<TemplateFormData>) => {
    if (!selectedTemplate) return

    try {
      await updateTemplate(selectedTemplate.id, data)
      setIsEditDialogOpen(false)
      setSelectedTemplate(null)
      toast({
        title: "Template Updated",
        description: `Template has been updated successfully.`
      })
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    try {
      await deleteTemplate(template.id)
      toast({
        title: "Template Deleted",
        description: `Template "${template.name}" has been deleted.`
      })
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      await duplicateTemplate(template.id)
      toast({
        title: "Template Duplicated",
        description: `Template "${template.name}" has been duplicated.`
      })
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    
    // Initialize preview variables with defaults
    const variables = extractTemplateVariables(
      template.subject_template + ' ' + template.body_template
    )
    const defaultVariables: Record<string, string> = {}
    variables.forEach(variable => {
      defaultVariables[variable] = `[${variable}]`
    })
    setPreviewVariables(defaultVariables)
    setIsPreviewDialogOpen(true)
  }

  const renderPreview = () => {
    if (!selectedTemplate) return null

    const subjectPreview = replaceTemplateVariables(
      selectedTemplate.subject_template,
      previewVariables
    )
    const bodyPreview = replaceTemplateVariables(
      selectedTemplate.body_template,
      previewVariables
    )

    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Subject Preview</Label>
          <div className="mt-1 p-3 bg-muted rounded-md text-sm">
            {subjectPreview.subject}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Body Preview</Label>
          <div className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
            {bodyPreview.body}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[800px]">
        <SheetHeader>
          <SheetTitle>Email Templates</SheetTitle>
          <SheetDescription>
            Manage your email templates for quick replies and campaigns.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {/* Search and Filter Bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={(value: 'all' | 'personal' | 'campaign') => setSelectedType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>

          {/* Templates List */}
          <ScrollArea className="flex-1">
            <Tabs value={selectedType === 'all' ? 'personal' : selectedType} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">
                  Personal ({groupedTemplates.personal.length})
                </TabsTrigger>
                <TabsTrigger value="campaign">
                  Campaign ({groupedTemplates.campaign.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-2 mt-4">
                {groupedTemplates.personal.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => {
                      setSelectedTemplate(template)
                      setIsEditDialogOpen(true)
                    }}
                    onDelete={() => handleDeleteTemplate(template)}
                    onDuplicate={() => handleDuplicateTemplate(template)}
                    onPreview={() => handlePreviewTemplate(template)}
                    onSelect={() => onTemplateSelect?.(template)}
                    onInsert={() => onTemplateInsert?.(template)}
                  />
                ))}
                {groupedTemplates.personal.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No personal templates found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="campaign" className="space-y-2 mt-4">
                {groupedTemplates.campaign.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => {
                      setSelectedTemplate(template)
                      setIsEditDialogOpen(true)
                    }}
                    onDelete={() => handleDeleteTemplate(template)}
                    onDuplicate={() => handleDuplicateTemplate(template)}
                    onPreview={() => handlePreviewTemplate(template)}
                    onSelect={() => onTemplateSelect?.(template)}
                    onInsert={() => onTemplateInsert?.(template)}
                  />
                ))}
                {groupedTemplates.campaign.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No campaign templates found
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTemplates('json')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Create Template Dialog */}
        <TemplateFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateTemplate}
          title="Create Template"
          description="Create a new email template for quick replies or campaigns."
        />

        {/* Edit Template Dialog */}
        <TemplateFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleUpdateTemplate}
          title="Edit Template"
          description="Update your email template."
          initialData={selectedTemplate}
        />

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
              <DialogDescription>
                Preview how your template will look with sample data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Variable Inputs */}
              {selectedTemplate && extractTemplateVariables(
                selectedTemplate.subject_template + ' ' + selectedTemplate.body_template
              ).map((variable) => (
                <div key={variable}>
                  <Label htmlFor={variable} className="text-sm">
                    {variable}
                  </Label>
                  <Input
                    id={variable}
                    value={previewVariables[variable] || ''}
                    onChange={(e) => setPreviewVariables(prev => ({
                      ...prev,
                      [variable]: e.target.value
                    }))}
                    placeholder={`Enter ${variable}`}
                  />
                </div>
              ))}
              
              {/* Preview */}
              {renderPreview()}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsPreviewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  )
}

// Template Card Component
function TemplateCard({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
  onSelect,
  onInsert
}: {
  template: EmailTemplate
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onPreview: () => void
  onSelect?: () => void
  onInsert?: () => void
}) {
  const variables = extractTemplateVariables(
    template.subject_template + ' ' + template.body_template
  )

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium truncate">{template.name}</h4>
            <Badge variant="outline" className="text-xs">
              {template.template_type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {template.subject_template}
          </p>
          {variables.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {variables.slice(0, 3).map((variable) => (
                <Badge key={variable} variant="secondary" className="text-xs">
                  {variable}
                </Badge>
              ))}
              {variables.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{variables.length - 3} more
                </Badge>
              )}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Created {new Date(template.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <div className="h-4 w-4 flex items-center justify-center">⋮</div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </DropdownMenuItem>
            {onSelect && (
              <DropdownMenuItem onClick={onSelect}>
                <Star className="h-4 w-4 mr-2" />
                Select
              </DropdownMenuItem>
            )}
            {onInsert && (
              <DropdownMenuItem onClick={onInsert}>
                <Plus className="h-4 w-4 mr-2" />
                Insert
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Template Form Dialog Component
function TemplateFormDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  initialData
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TemplateFormData) => void
  title: string
  description: string
  initialData?: EmailTemplate | null
}) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: initialData?.name || '',
    subject_template: initialData?.subject_template || '',
    body_template: initialData?.body_template || '',
    template_type: initialData?.template_type || 'personal',
    variables: initialData?.variables || {}
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Follow-up Email"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Template Type</Label>
              <Select
                value={formData.template_type}
                onValueChange={(value: 'personal' | 'campaign') =>
                  setFormData(prev => ({ ...prev, template_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="subject">Subject Template</Label>
            <Input
              id="subject"
              value={formData.subject_template}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
              placeholder="e.g., Follow-up: {{subject}}"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="body">Body Template</Label>
            <Textarea
              id="body"
              value={formData.body_template}
              onChange={(e) => setFormData(prev => ({ ...prev, body_template: e.target.value }))}
              placeholder="Hi {{first_name}},&#10;&#10;Thank you for your interest in..."
              rows={8}
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
