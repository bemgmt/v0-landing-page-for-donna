import { VerticalKey } from "@/lib/constants/verticals"

// Base settings structure
export interface DONNASettings {
  profile: ProfileIdentitySettings
  behavior: BehaviorPersonalitySettings
  knowledge: KnowledgeMemorySettings
  integrations: ToolsIntegrationsSettings
  channels: CommunicationChannelsSettings
  automations: AutomationsWorkflowsSettings
  privacy: PrivacySecuritySettings
  notifications: NotificationsSettings
  billing: BillingPlanSettings
  advanced: AdvancedDeveloperSettings
}

// 1. Profile & Identity
export interface ProfileIdentitySettings {
  donnaName: string
  businessName: string
  primaryContact: string
  industry: string
  vertical: VerticalKey | null
  timezone: string
  language: string
  brandVoice: 'professional' | 'friendly' | 'donna' | 'custom'
  customBrandVoice?: string // Pro & Enterprise only
  verticalSpecific?: VerticalSpecificConfig
}

export interface VerticalSpecificConfig {
  hospitality?: HospitalityConfig
  realEstate?: RealEstateConfig
  professionalServices?: ProfessionalServicesConfig
}

export interface HospitalityConfig {
  frontDeskAutomation: boolean
  reservationHandling: 'auto' | 'semi-auto' | 'manual'
  conciergeInteractions: boolean
}

export interface RealEstateConfig {
  leadQualificationRules: string
  showingScheduling: 'auto' | 'semi-auto' | 'manual'
  documentHandling: boolean
}

export interface ProfessionalServicesConfig {
  emailTriageRules: string
  meetingNotes: boolean
  documentAutomation: boolean
}

// 2. Behavior & Personality
export interface BehaviorPersonalitySettings {
  responseStyle: 'concise' | 'balanced' | 'detailed'
  confidenceLevel: 'conservative' | 'balanced' | 'assertive'
  escalationThreshold: string
  autonomyLevel: 'inform' | 'suggest' | 'execute'
}

// 3. Knowledge & Memory
export interface KnowledgeMemorySettings {
  uploadedDocuments: DocumentInfo[]
  websiteSources: string[]
  crmDataFeeds: boolean
  manualNotes: string
  memoryScope: 'conversation' | 'user' | 'global'
}

export interface DocumentInfo {
  id: string
  name: string
  type: 'pdf' | 'doc' | 'sop' | 'contract'
  uploadedAt: string
  size: number
}

// 4. Tools & Integrations
export interface ToolsIntegrationsSettings {
  email: EmailIntegrationSettings
  calendar: IntegrationSettings
  crm: CRMIntegrationSettings
  payments: IntegrationSettings
  forms: IntegrationSettings
  zapier: IntegrationSettings
  customApis: CustomAPISettings[]
  telnyx: TelnyxSettings
}

export interface IntegrationSettings {
  enabled: boolean
  readPermission: boolean
  writePermission: boolean
  humanApprovalRequired: boolean
  connectionStatus: 'connected' | 'disconnected' | 'error'
  connectedAt?: string
}

export interface EmailIntegrationSettings extends IntegrationSettings {
  provider: 'smtp' | 'gmail' | 'exchange'
  gmailPubSub?: GmailPubSubSettings // Future
}

export interface GmailPubSubSettings {
  enabled: boolean
  subscriptionId?: string
  topic?: string
  pushEndpoint?: string
  pollingFallback: boolean
}

export interface CRMIntegrationSettings extends IntegrationSettings {
  provider: 'salesforce' | 'hubspot' | 'custom' | null
  pipelineConfig?: CRMPipelineConfig
}

export interface CRMPipelineConfig {
  dealStages: DealStage[]
  customFieldMappings: CustomFieldMapping[]
  automationRules: AutomationRule[]
  multiTenantReporting: boolean
  forecastingModel: 'linear' | 'exponential' | 'custom'
}

export interface DealStage {
  id: string
  name: string
  order: number
  probability: number
}

export interface CustomFieldMapping {
  crmField: string
  donnaField: string
  type: 'string' | 'number' | 'date' | 'boolean'
}

export interface AutomationRule {
  id: string
  name: string
  condition: string
  action: string
  enabled: boolean
}

export interface CustomAPISettings {
  id: string
  name: string
  baseUrl: string
  apiKey?: string
  enabled: boolean
}

export interface TelnyxSettings {
  voice: TelnyxVoiceSettings
  sms: TelnyxSMSSettings
  connectionStatus: 'connected' | 'disconnected' | 'error'
  lastConnectedAt?: string
}

export interface TelnyxVoiceSettings {
  apiKey?: string
  connectionId?: string
  phoneNumber?: string
  inboundNumber?: string
  outboundNumber?: string
  webhookUrl?: string
  callRecording: boolean
  recordingStorageLocation?: string
  callControlPreferences: {
    autoAnswer: boolean
    autoHangup: boolean
    transferRules: string
  }
}

export interface TelnyxSMSSettings {
  messagingProfileId?: string
  phoneNumber?: string
  deliveryStatusTracking: boolean
  mmsSupport: boolean
  webhookUrl?: string
}

// 5. Communication Channels
export interface CommunicationChannelsSettings {
  websiteChat: ChannelSettings
  sms: ChannelSettings
  email: ChannelSettings
  voice: ChannelSettings
  dashboard: ChannelSettings
  webrtc: WebRTCSettings
  telnyxChannels: TelnyxChannelSettings
}

export interface ChannelSettings {
  enabled: boolean
  toneOverride?: string
  businessHours: BusinessHours
  autoReplyRules: string
  escalationPath: string
  signature: string
}

export interface BusinessHours {
  enabled: boolean
  timezone: string
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export interface DaySchedule {
  enabled: boolean
  start: string // HH:mm format
  end: string // HH:mm format
}

export interface WebRTCSettings {
  vadEnabled: boolean
  reconnection: {
    maxRetries: number
    backoffStrategy: 'exponential' | 'linear'
    timeout: number
  }
  websocketProxy?: {
    enabled: boolean
    url?: string
    authentication?: string
    rateLimiting: boolean
  }
}

export interface TelnyxChannelSettings {
  voice: {
    phoneNumber?: string
    callRoutingRules: string
    recordingPreferences: 'always' | 'on-demand' | 'never'
  }
  sms: {
    messagingProfile?: string
    deliveryConfirmation: boolean
    autoReplyTemplates: string[]
  }
}

// 6. Automations & Workflows
export interface AutomationsWorkflowsSettings {
  workflows: Workflow[]
  verticalSpecificTemplates: boolean
}

export interface Workflow {
  id: string
  name: string
  enabled: boolean
  triggerRules: TriggerRule[]
  timeBasedActions: TimeBasedAction[]
  conditionalLogic: ConditionalLogic[]
  humanInTheLoop: boolean
  vertical?: VerticalKey
}

export interface TriggerRule {
  type: 'event' | 'time' | 'condition'
  condition: string
}

export interface TimeBasedAction {
  schedule: string // cron expression
  action: string
}

export interface ConditionalLogic {
  if: string
  then: string
  else?: string
}

// 7. Privacy, Security & Governance
export interface PrivacySecuritySettings {
  dataRetentionPolicy: '30days' | '90days' | '1year' | 'indefinite' | 'custom'
  customRetentionDays?: number
  accessLogsEnabled: boolean
  roleBasedPermissions: RoleBasedPermissions
  adminRole: boolean
  operatorRole: boolean
  exportDataEnabled: boolean
  deleteDataEnabled: boolean
  compliance: ComplianceSettings
  aiUsageTransparencyLog: boolean
}

export interface RoleBasedPermissions {
  admins: string[]
  operators: string[]
  viewers: string[]
}

export interface ComplianceSettings {
  gdpr: boolean
  ccpa: boolean
  hipaa: boolean
  other: string[]
}

// 8. Notifications & Alerts
export interface NotificationsSettings {
  escalationAlerts: AlertSettings
  taskCompletion: AlertSettings
  errorsFailures: AlertSettings
  newPatterns: AlertSettings
  weeklySummaries: AlertSettings
  telnyxSMSDelivery: boolean
}

export interface AlertSettings {
  enabled: boolean
  deliveryMethods: ('email' | 'sms' | 'dashboard' | 'silent')[]
}

// 9. Billing & Plan
export interface BillingPlanSettings {
  planTier: 'free' | 'pro' | 'enterprise'
  usageStats: UsageStats
  addons: Addon[]
  invoices: Invoice[]
  paymentMethods: PaymentMethod[]
}

export interface UsageStats {
  messagesThisMonth: number
  apiCallsThisMonth: number
  storageUsed: number
  storageLimit: number
}

export interface Addon {
  id: string
  name: string
  enabled: boolean
  price: number
}

export interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  downloadUrl?: string
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'paypal'
  last4?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

// 10. Advanced / Developer
export interface AdvancedDeveloperSettings {
  apiKeys: APIKey[]
  webhooks: Webhook[]
  sandboxMode: boolean
  debugLogsEnabled: boolean
  resetToDefault: boolean
  performance: PerformanceSettings
  analytics: AnalyticsSettings
}

export interface APIKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed?: string
  permissions: string[]
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  enabled: boolean
  secret?: string
}

export interface PerformanceSettings {
  redis: RedisSettings
  jobQueue: JobQueueSettings
  optimization: OptimizationSettings
}

export interface RedisSettings {
  enabled: boolean
  cacheTTL: number // seconds
  invalidationRules: string[]
  keyPrefix: string
}

export interface JobQueueSettings {
  provider: 'redis' | 'database' | 'sqs' | 'custom'
  retrySettings: {
    maxRetries: number
    backoffMultiplier: number
  }
  priorityLevels: number
}

export interface OptimizationSettings {
  cachingEnabled: boolean
  cacheWarming: boolean
  queryOptimization: boolean
}

export interface AnalyticsSettings {
  tracing: TracingSettings
  sla: SLASettings
  performanceMonitoring: PerformanceMonitoringSettings
  dashboard: DashboardSettings
  sentry: SentrySettings
}

export interface TracingSettings {
  enabled: boolean
  samplingRate: number // 0-100 percentage
  retentionPeriod: number // days
}

export interface SLASettings {
  responseTimeThreshold: number // milliseconds
  errorRateThreshold: number // percentage
  uptimeRequirement: number // percentage
}

export interface PerformanceMonitoringSettings {
  enabled: boolean
  metricsCollectionInterval: number // seconds
  alertThresholds: {
    cpu: number
    memory: number
    responseTime: number
  }
}

export interface DashboardSettings {
  defaultLayout: 'grid' | 'list' | 'custom'
  customMetrics: string[]
  reportGenerationSchedule: string // cron expression
}

export interface SentrySettings {
  errorTracking: boolean
  performanceMonitoring: boolean
  releaseTracking: boolean
}

// Default settings
export const defaultSettings: DONNASettings = {
  profile: {
    donnaName: 'DONNA',
    businessName: '',
    primaryContact: '',
    industry: '',
    vertical: null,
    timezone: 'America/New_York',
    language: 'en',
    brandVoice: 'professional',
  },
  behavior: {
    responseStyle: 'balanced',
    confidenceLevel: 'balanced',
    escalationThreshold: 'medium',
    autonomyLevel: 'suggest',
  },
  knowledge: {
    uploadedDocuments: [],
    websiteSources: [],
    crmDataFeeds: false,
    manualNotes: '',
    memoryScope: 'user',
  },
  integrations: {
    email: {
      enabled: false,
      provider: 'gmail',
      readPermission: true,
      writePermission: false,
      humanApprovalRequired: true,
      connectionStatus: 'disconnected',
      gmailPubSub: {
        enabled: false,
        pollingFallback: true,
      },
    },
    calendar: {
      enabled: false,
      readPermission: true,
      writePermission: false,
      humanApprovalRequired: true,
      connectionStatus: 'disconnected',
    },
    crm: {
      enabled: false,
      provider: null,
      readPermission: true,
      writePermission: false,
      humanApprovalRequired: true,
      connectionStatus: 'disconnected',
    },
    payments: {
      enabled: false,
      readPermission: true,
      writePermission: false,
      humanApprovalRequired: true,
      connectionStatus: 'disconnected',
    },
    forms: {
      enabled: false,
      readPermission: true,
      writePermission: false,
      humanApprovalRequired: true,
      connectionStatus: 'disconnected',
    },
    zapier: {
      enabled: false,
      readPermission: true,
      writePermission: false,
      humanApprovalRequired: true,
      connectionStatus: 'disconnected',
    },
    customApis: [],
    telnyx: {
      voice: {
        callRecording: false,
        callControlPreferences: {
          autoAnswer: false,
          autoHangup: false,
          transferRules: '',
        },
      },
      sms: {
        deliveryStatusTracking: true,
        mmsSupport: false,
      },
      connectionStatus: 'disconnected',
    },
  },
  channels: {
    websiteChat: {
      enabled: true,
      businessHours: createDefaultBusinessHours(),
      autoReplyRules: '',
      escalationPath: '',
      signature: '',
    },
    sms: {
      enabled: false,
      businessHours: createDefaultBusinessHours(),
      autoReplyRules: '',
      escalationPath: '',
      signature: '',
    },
    email: {
      enabled: true,
      businessHours: createDefaultBusinessHours(),
      autoReplyRules: '',
      escalationPath: '',
      signature: '',
    },
    voice: {
      enabled: false,
      businessHours: createDefaultBusinessHours(),
      autoReplyRules: '',
      escalationPath: '',
      signature: '',
    },
    dashboard: {
      enabled: true,
      businessHours: createDefaultBusinessHours(),
      autoReplyRules: '',
      escalationPath: '',
      signature: '',
    },
    webrtc: {
      vadEnabled: true,
      reconnection: {
        maxRetries: 5,
        backoffStrategy: 'exponential',
        timeout: 30000,
      },
    },
    telnyxChannels: {
      voice: {
        callRoutingRules: '',
        recordingPreferences: 'on-demand',
      },
      sms: {
        deliveryConfirmation: true,
        autoReplyTemplates: [],
      },
    },
  },
  automations: {
    workflows: [],
    verticalSpecificTemplates: false,
  },
  privacy: {
    dataRetentionPolicy: '90days',
    accessLogsEnabled: true,
    roleBasedPermissions: {
      admins: [],
      operators: [],
      viewers: [],
    },
    adminRole: false,
    operatorRole: false,
    exportDataEnabled: true,
    deleteDataEnabled: true,
    compliance: {
      gdpr: false,
      ccpa: false,
      hipaa: false,
      other: [],
    },
    aiUsageTransparencyLog: true,
  },
  notifications: {
    escalationAlerts: {
      enabled: true,
      deliveryMethods: ['email', 'dashboard'],
    },
    taskCompletion: {
      enabled: true,
      deliveryMethods: ['dashboard'],
    },
    errorsFailures: {
      enabled: true,
      deliveryMethods: ['email', 'dashboard'],
    },
    newPatterns: {
      enabled: false,
      deliveryMethods: ['dashboard'],
    },
    weeklySummaries: {
      enabled: true,
      deliveryMethods: ['email'],
    },
    telnyxSMSDelivery: false,
  },
  billing: {
    planTier: 'free',
    usageStats: {
      messagesThisMonth: 0,
      apiCallsThisMonth: 0,
      storageUsed: 0,
      storageLimit: 1000000000, // 1GB in bytes
    },
    addons: [],
    invoices: [],
    paymentMethods: [],
  },
  advanced: {
    apiKeys: [],
    webhooks: [],
    sandboxMode: false,
    debugLogsEnabled: false,
    resetToDefault: false,
    performance: {
      redis: {
        enabled: false,
        cacheTTL: 3600,
        invalidationRules: [],
        keyPrefix: 'donna:',
      },
      jobQueue: {
        provider: 'database',
        retrySettings: {
          maxRetries: 3,
          backoffMultiplier: 2,
        },
        priorityLevels: 5,
      },
      optimization: {
        cachingEnabled: true,
        cacheWarming: false,
        queryOptimization: true,
      },
    },
    analytics: {
      tracing: {
        enabled: false,
        samplingRate: 10,
        retentionPeriod: 7,
      },
      sla: {
        responseTimeThreshold: 1000,
        errorRateThreshold: 1,
        uptimeRequirement: 99.9,
      },
      performanceMonitoring: {
        enabled: true,
        metricsCollectionInterval: 60,
        alertThresholds: {
          cpu: 80,
          memory: 80,
          responseTime: 2000,
        },
      },
      dashboard: {
        defaultLayout: 'grid',
        customMetrics: [],
        reportGenerationSchedule: '0 0 * * 0', // Weekly on Sunday
      },
      sentry: {
        errorTracking: true,
        performanceMonitoring: true,
        releaseTracking: true,
      },
    },
  },
}

function createDefaultBusinessHours(): BusinessHours {
  const defaultDay: DaySchedule = {
    enabled: true,
    start: '09:00',
    end: '17:00',
  }
  
  return {
    enabled: true,
    timezone: 'America/New_York',
    monday: { ...defaultDay },
    tuesday: { ...defaultDay },
    wednesday: { ...defaultDay },
    thursday: { ...defaultDay },
    friday: { ...defaultDay },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  }
}
