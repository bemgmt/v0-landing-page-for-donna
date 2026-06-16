export type VerticalKey = 'hospitality' | 'real_estate' | 'professional_services'

export interface VerticalOption {
  key: VerticalKey
  label: string
  description: string
}

export const VERTICALS: VerticalOption[] = [
  {
    key: 'hospitality',
    label: 'Hospitality',
    description: 'Front desk automation, concierge interactions, reservations, and guest handling.'
  },
  {
    key: 'real_estate',
    label: 'Real Estate',
    description: 'Lead qualification, follow-ups, showing scheduling, and document handling.'
  },
  {
    key: 'professional_services',
    label: 'Professional Services',
    description: 'Email triage, voice receptionist, document automation, meeting notes, and CRM updates.'
  }
]

export const ALLOWED_VERTICALS: VerticalKey[] = VERTICALS.map(v => v.key)

export function isValidVertical(value: string): value is VerticalKey {
  return ALLOWED_VERTICALS.includes(value as VerticalKey)
}

