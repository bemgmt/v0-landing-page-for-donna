"use client"

import { useState, useEffect } from "react"
import { type VerticalKey } from "@/lib/constants/verticals"

export function useVertical() {
  const [vertical, setVertical] = useState<VerticalKey | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVertical = async () => {
      try {
        const response = await fetch('/api/user/vertical')
        if (!response.ok) {
          throw new Error('Failed to fetch vertical')
        }
        const data = await response.json()
        setVertical(data.vertical || null)
      } catch (err) {
        console.error('Error fetching vertical:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVertical()
  }, [])

  return { vertical, isLoading, error }
}

