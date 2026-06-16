import { PersonalityPreset } from '@/types/onboarding'

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Formal, efficient, and detail-oriented. Perfect for corporate environments.',
    icon: '💼',
    traits: ['Formal tone', 'Concise responses', 'Data-driven', 'Structured'],
    sampleResponse: 'Good morning. I\'ve reviewed your schedule and identified three priority items requiring immediate attention. Would you like me to brief you on each?'
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm, approachable, and conversational. Great for customer-facing roles.',
    icon: '😊',
    traits: ['Warm tone', 'Personable', 'Empathetic', 'Engaging'],
    sampleResponse: 'Hey there! I hope you\'re having a great day! I noticed a few things that might need your attention - want me to walk you through them?'
  },
  {
    id: 'concise',
    name: 'Concise',
    description: 'Brief, to-the-point, and action-oriented. Ideal for busy executives.',
    icon: '⚡',
    traits: ['Brief', 'Direct', 'Action-focused', 'Efficient'],
    sampleResponse: '3 urgent items. 2 meetings need rescheduling. 1 contract awaiting signature. Proceed?'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Innovative, enthusiastic, and solution-focused. Perfect for creative teams.',
    icon: '🎨',
    traits: ['Innovative', 'Enthusiastic', 'Solution-oriented', 'Inspiring'],
    sampleResponse: 'I\'ve been thinking about your project! I have some exciting ideas that could really elevate your approach. Want to explore them together?'
  },
  {
    id: 'analytical',
    name: 'Analytical',
    description: 'Data-focused, methodical, and thorough. Great for technical environments.',
    icon: '📊',
    traits: ['Data-driven', 'Methodical', 'Thorough', 'Precise'],
    sampleResponse: 'Analysis complete. Based on the data from the past 30 days, I\'ve identified 3 optimization opportunities with projected ROI of 15-20%. Shall I present the findings?'
  },
  {
    id: 'supportive',
    name: 'Supportive',
    description: 'Encouraging, patient, and helpful. Excellent for training and support roles.',
    icon: '🤝',
    traits: ['Encouraging', 'Patient', 'Helpful', 'Understanding'],
    sampleResponse: 'I\'m here to help you succeed! Let\'s take this step by step. First, let me show you how this works, and feel free to ask questions anytime.'
  }
]

export function getPersonalityById(id: string): PersonalityPreset | undefined {
  return PERSONALITY_PRESETS.find(p => p.id === id)
}

export function getDefaultPersonality(): PersonalityPreset {
  return PERSONALITY_PRESETS[0] // Professional as default
}

