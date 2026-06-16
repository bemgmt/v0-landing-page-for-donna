import { useState, useEffect, useCallback } from 'react'
import { EmailTemplate, TemplateFormData, UseEmailTemplatesReturn } from '@/types/email'
import { toast } from '@/hooks/use-toast'

interface UseEmailTemplatesOptions {
  templateType?: 'personal' | 'campaign' | 'all'
  autoRefresh?: boolean
  cacheTime?: number
}

export function useEmailTemplates(
  options: UseEmailTemplatesOptions = {}
): UseEmailTemplatesReturn {
  const { templateType = 'all', autoRefresh = false, cacheTime = 5 * 60 * 1000 } = options
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Fetch templates from API
  const fetchTemplates = useCallback(async (force = false) => {
    // Check cache validity
    if (!force && Date.now() - lastFetch < cacheTime && templates.length > 0) {
      return templates
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (templateType !== 'all') {
        params.append('type', templateType)
      }

      const response = await fetch(`/api/gmail/templates?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`)
      }

      const data = await response.json()
      setTemplates(data.templates || [])
      setLastFetch(Date.now())
      
      return data.templates || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return []
    } finally {
      setLoading(false)
    }
  }, [templateType, cacheTime, lastFetch, templates.length])

  // Create new template
  const createTemplate = useCallback(async (data: TemplateFormData): Promise<EmailTemplate> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/gmail/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create template: ${response.statusText}`)
      }

      const result = await response.json()
      const newTemplate = result.template

      // Update local state
      setTemplates(prev => [newTemplate, ...prev])

      toast({
        title: 'Template Created',
        description: `Template "${data.name}" has been created successfully.`
      })

      return newTemplate
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Update existing template
  const updateTemplate = useCallback(async (
    id: string, 
    data: Partial<TemplateFormData>
  ): Promise<EmailTemplate> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/gmail/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, ...data })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update template: ${response.statusText}`)
      }

      const result = await response.json()
      const updatedTemplate = result.template

      // Update local state
      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? updatedTemplate : template
        )
      )

      toast({
        title: 'Template Updated',
        description: `Template "${updatedTemplate.name}" has been updated successfully.`
      })

      return updatedTemplate
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete template
  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/gmail/templates?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete template: ${response.statusText}`)
      }

      // Update local state
      const deletedTemplate = templates.find(t => t.id === id)
      setTemplates(prev => prev.filter(template => template.id !== id))

      toast({
        title: 'Template Deleted',
        description: `Template "${deletedTemplate?.name || 'Unknown'}" has been deleted.`
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [templates])

  // Refresh templates
  const refreshTemplates = useCallback(async (): Promise<void> => {
    await fetchTemplates(true)
  }, [fetchTemplates])

  // Duplicate template
  const duplicateTemplate = useCallback(async (id: string): Promise<EmailTemplate> => {
    const originalTemplate = templates.find(t => t.id === id)
    if (!originalTemplate) {
      throw new Error('Template not found')
    }

    const duplicateData: TemplateFormData = {
      name: `${originalTemplate.name} (Copy)`,
      subject_template: originalTemplate.subject_template,
      body_template: originalTemplate.body_template,
      template_type: originalTemplate.template_type,
      variables: originalTemplate.variables
    }

    return createTemplate(duplicateData)
  }, [templates, createTemplate])

  // Search templates
  const searchTemplates = useCallback((query: string): EmailTemplate[] => {
    if (!query.trim()) return templates

    const searchTerm = query.toLowerCase()
    return templates.filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      template.subject_template.toLowerCase().includes(searchTerm) ||
      template.body_template.toLowerCase().includes(searchTerm)
    )
  }, [templates])

  // Get template by ID
  const getTemplate = useCallback((id: string): EmailTemplate | undefined => {
    return templates.find(template => template.id === id)
  }, [templates])

  // Get templates by type
  const getTemplatesByType = useCallback((type: 'personal' | 'campaign'): EmailTemplate[] => {
    return templates.filter(template => template.template_type === type)
  }, [templates])

  // Export templates
  const exportTemplates = useCallback(async (format: 'json' | 'csv' = 'json'): Promise<void> => {
    try {
      let content: string
      let filename: string
      let mimeType: string

      if (format === 'json') {
        content = JSON.stringify(templates, null, 2)
        filename = `email-templates-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      } else {
        // CSV format
        const headers = ['Name', 'Type', 'Subject Template', 'Body Template', 'Created At']
        const rows = templates.map(template => [
          template.name,
          template.template_type,
          template.subject_template,
          template.body_template.replace(/\n/g, ' '),
          template.created_at
        ])
        
        content = [headers, ...rows]
          .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
          .join('\n')
        
        filename = `email-templates-${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Complete',
        description: `Templates exported as ${filename}`
      })
    } catch (err) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export templates',
        variant: 'destructive'
      })
    }
  }, [templates])

  // Initial fetch
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchTemplates()
    }, cacheTime)

    return () => clearInterval(interval)
  }, [autoRefresh, cacheTime, fetchTemplates])

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates,
    duplicateTemplate,
    searchTemplates,
    getTemplate,
    getTemplatesByType,
    exportTemplates,
    personalTemplates: templates.filter(t => t.template_type === 'personal'),
    campaignTemplates: templates.filter(t => t.template_type === 'campaign'),
    totalCount: templates.length
  }
}

// Extended return type with additional methods
export interface ExtendedUseEmailTemplatesReturn extends UseEmailTemplatesReturn {
  duplicateTemplate: (id: string) => Promise<EmailTemplate>
  searchTemplates: (query: string) => EmailTemplate[]
  getTemplate: (id: string) => EmailTemplate | undefined
  getTemplatesByType: (type: 'personal' | 'campaign') => EmailTemplate[]
  exportTemplates: (format?: 'json' | 'csv') => Promise<void>
  personalTemplates: EmailTemplate[]
  campaignTemplates: EmailTemplate[]
  totalCount: number
}
