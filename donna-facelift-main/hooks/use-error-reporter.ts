'use client'

import { useSentry } from './useSentry'
import { useToast } from './use-toast'

export function useErrorReporter() {
  const { captureError } = useSentry()
  const { toast } = useToast()

  const reportError = (error: Error, context?: Record<string, any>, message?: string) => {
    captureError(error, context)
    toast({
      variant: 'destructive',
      title: 'An error occurred',
      description: message || error.message || 'An unexpected error occurred. The team has been notified.',
    })
  }

  return { reportError }
}
