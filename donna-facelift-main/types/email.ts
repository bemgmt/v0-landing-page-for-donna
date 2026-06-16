// Enhanced email functionality type definitions

// OpenAI model types for email operations
export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4o-realtime-preview'
  | 'gpt-4o-realtime-preview-2024-12-17'
  | 'gpt-4o-realtime-preview-2024-10-01'
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'

export interface EmailTemplate {
  id: string
  user_id: string
  name: string
  subject_template: string
  body_template: string
  template_type: 'personal' | 'campaign'
  variables: Record<string, TemplateVariable>
  created_at: string
  updated_at: string
}

export interface TemplateVariable {
  description: string
  required: boolean
  default_value?: string
  type?: 'text' | 'email' | 'url' | 'date' | 'number'
}

export interface MessageMetadata {
  id: string
  user_id: string
  gmail_message_id: string
  category: EmailCategory
  priority_level: PriorityLevel
  custom_tags: string[]
  campaign_id: string | null
  created_at: string
  updated_at: string
  email_campaigns?: CampaignData | null
}

export type EmailCategory = 
  | 'marketing' 
  | 'sales' 
  | 'support' 
  | 'personal' 
  | 'unread'
  | string // Allow custom categories

export enum PriorityLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none'
}

export interface BulkOperation {
  action: BulkActionType
  message_ids: string[]
  parameters?: BulkOperationParameters
}

export type BulkActionType = 
  | 'archive' 
  | 'star' 
  | 'unstar' 
  | 'apply_template' 
  | 'add_to_campaign' 
  | 'set_category' 
  | 'set_priority'

export interface BulkOperationParameters {
  template_id?: string
  category?: EmailCategory
  priority_level?: PriorityLevel
  campaign_id?: string
  custom_tags?: string[]
}

export interface BulkOperationResult {
  success: number
  failed: number
  errors: string[]
}

export interface CampaignData {
  id: string
  user_id: string
  name: string
  description: string
  status: CampaignStatus
  target_label: string
  email_sequence: EmailSequenceStep[]
  created_at: string
  updated_at: string
  campaign_email_steps?: CampaignEmailStep[]
  statistics?: CampaignStatistics
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'

export interface EmailSequenceStep {
  step_number: number
  delay_days: number
  subject_template: string
  body_template: string
  trigger_type: 'time' | 'action' | 'condition'
}

export interface CampaignEmailStep {
  id: string
  campaign_id: string
  step_number: number
  delay_days: number
  subject_template: string
  body_template: string
  trigger_type: 'time' | 'action' | 'condition'
  created_at: string
  updated_at: string
}

export interface CampaignStatistics {
  emails_sent: number
  replies: number
  messages_in_campaign: number
  open_rate: number
}

export interface AIReplyOptions {
  tone: 'professional' | 'friendly' | 'casual'
  length: 'short' | 'medium' | 'long'
  include_cta: boolean
  cta_type: 'meeting' | 'call' | 'demo' | 'custom'
  template_id?: string
  marketing_goal?: string
}

export interface EnhancedMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: any
  sizeEstimate: number
  historyId: string
  internalDate: string
  metadata?: MessageMetadata | null
}

export interface EmailStatistics {
  total: number
  unread: number
  by_category: Record<string, number>
  by_priority: Record<string, number>
}

export interface EmailFilters {
  category?: EmailCategory
  priority?: PriorityLevel
  campaign_id?: string
  tags?: string[]
  sort?: 'date' | 'priority' | 'category'
  label?: string
  q?: string
}

export interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface EmailListResponse {
  messages: EnhancedMessage[]
  nextPageToken?: string
  resultSizeEstimate: number
  statistics: EmailStatistics
  filters_applied: EmailFilters
}

export interface TemplateListResponse {
  templates: EmailTemplate[]
}

export interface MetadataListResponse {
  metadata: MessageMetadata[]
  pagination: PaginationInfo
}

export interface CampaignListResponse {
  campaigns: CampaignData[]
  pagination: PaginationInfo
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface BulkOperationResponse extends ApiResponse {
  results: BulkOperationResult
}

// Draft reply metadata that mirrors AIReplyOptions structure
export interface DraftReplyMetadata extends Pick<AIReplyOptions, 'tone' | 'length' | 'include_cta' | 'cta_type'> {
  model_used: OpenAIModel
}

export interface DraftReplyResponse extends ApiResponse {
  draft: string
  metadata: DraftReplyMetadata
}

// Form types for UI components
export interface TemplateFormData {
  name: string
  subject_template: string
  body_template: string
  template_type: 'personal' | 'campaign'
  variables: Record<string, TemplateVariable>
}

export interface CampaignFormData {
  name: string
  description: string
  target_label: string
  email_sequence: EmailSequenceStep[]
  steps: CampaignEmailStep[]
}

export interface MetadataFormData {
  gmail_message_id: string
  category: EmailCategory
  priority_level: PriorityLevel
  custom_tags: string[]
  campaign_id?: string
}

// Hook return types
export interface UseBulkSelectionReturn {
  selectedIds: Set<string>
  selectAll: () => void
  selectNone: () => void
  toggleSelection: (id: string) => void
  isSelected: (id: string) => boolean
  selectionCount: number
  hasSelection: boolean
}

export interface UseEmailTemplatesReturn {
  templates: EmailTemplate[]
  loading: boolean
  error: string | null
  createTemplate: (data: TemplateFormData) => Promise<EmailTemplate>
  updateTemplate: (id: string, data: Partial<TemplateFormData>) => Promise<EmailTemplate>
  deleteTemplate: (id: string) => Promise<void>
  refreshTemplates: () => Promise<void>
}

// Utility types
export type TemplateVariableMap = Record<string, string>

export interface ProcessedTemplate {
  subject: string
  body: string
  variables_used: string[]
  missing_variables: string[]
}

export interface EmailSearchOptions {
  query?: string
  category?: EmailCategory
  priority?: PriorityLevel
  campaign_id?: string
  tags?: string[]
  date_range?: {
    start: string
    end: string
  }
  sender?: string
  has_attachments?: boolean
}

export interface EmailExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  include_metadata: boolean
  include_content: boolean
  filters: EmailFilters
  date_range?: {
    start: string
    end: string
  }
}
