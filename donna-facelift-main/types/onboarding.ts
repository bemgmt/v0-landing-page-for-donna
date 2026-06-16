/**
 * Onboarding and Tour System Types
 */

export type OnboardingStep = 
  | 'welcome'
  | 'profile'
  | 'personality'
  | 'tour'
  | 'complete'

export type TourType = 
  | 'full'
  | 'section'
  | 'mini'

export type TourStatus = 
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'skipped'

export interface OnboardingState {
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  userData: {
    name?: string
    businessName?: string
    documents?: string[]
  }
  personalitySelection: {
    type?: 'upload' | 'preset'
    uploadedConversations?: File[]
    selectedPreset?: string
  }
  tourState: TourState
  isComplete: boolean
}

export interface TourState {
  status: TourStatus
  currentTourType?: TourType
  currentStepIndex: number
  totalSteps: number
  visitedSections: string[]
  canResume: boolean
  lastPausedAt?: Date
}

export interface TourStep {
  id: string
  target: string // CSS selector or element ID
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlightPadding?: number
  action?: () => void
  beforeShow?: () => void | Promise<void>
  afterShow?: () => void | Promise<void>
  chatMessage?: string // Message to display in DONNA chat during this step
}

export interface TourConfig {
  id: string
  type: TourType
  title: string
  description: string
  steps: TourStep[]
  canSkip?: boolean
  canPause?: boolean
  autoStart?: boolean
  onComplete?: () => void
  onSkip?: () => void
}

export interface PersonalityPreset {
  id: string
  name: string
  description: string
  icon: string
  traits: string[]
  sampleResponse: string
}

export interface OnboardingProgress {
  userId: string
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  tourProgress: {
    fullTourCompleted: boolean
    sectionsVisited: string[]
    miniToursCompleted: string[]
  }
  preferences: {
    skipTour?: boolean
    tourSpeed?: 'slow' | 'normal' | 'fast'
  }
  createdAt: Date
  updatedAt: Date
}

