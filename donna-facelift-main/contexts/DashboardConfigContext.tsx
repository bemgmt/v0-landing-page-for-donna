"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface DashboardWidget {
  id: string
  type: 'stat' | 'table' | 'chart'
  customName?: string
  order?: number
}

export interface DashboardConfig {
  widgets: DashboardWidget[]
  mainInterface?: {
    visibleModules?: string[]
    layout?: Record<string, unknown>
  }
}

interface DashboardConfigContextType {
  config: DashboardConfig | null
  isLoading: boolean
  vertical: string | null
  setVertical: (v: string | null) => void
  updateConfig: (config: Partial<DashboardConfig>) => Promise<void>
  refresh: () => Promise<void>
}

const DashboardConfigContext = createContext<DashboardConfigContextType | null>(null)

export function DashboardConfigProvider({
  children,
  initialVertical = null,
}: {
  children: React.ReactNode
  initialVertical?: string | null
}) {
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [vertical, setVerticalState] = useState<string | null>(initialVertical ?? null)

  useEffect(() => {
    setVerticalState(initialVertical ?? null)
  }, [initialVertical])

  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const v = vertical || 'default'
      const res = await fetch(`/api/user/dashboard-config?vertical=${encodeURIComponent(v)}`)
      const data = await res.json()
      if (data.success && data.config) {
        setConfig({
          widgets: data.config.widgets ?? [],
          mainInterface: data.config.mainInterface,
        })
      } else {
        setConfig({ widgets: [], mainInterface: undefined })
      }
    } catch {
      setConfig({ widgets: [], mainInterface: undefined })
    } finally {
      setIsLoading(false)
    }
  }, [vertical])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const updateConfig = useCallback(
    async (updates: Partial<DashboardConfig>) => {
      const v = vertical || 'default'
      const merged: DashboardConfig = {
        widgets: updates.widgets ?? config?.widgets ?? [],
        mainInterface: updates.mainInterface ?? config?.mainInterface,
      }
      setConfig(merged)
      try {
        await fetch('/api/user/dashboard-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...merged,
            vertical: v,
          }),
        })
      } catch (err) {
        console.error('Failed to save dashboard config:', err)
      }
    },
    [config, vertical]
  )

  const setVertical = useCallback((v: string | null) => {
    setVerticalState(v)
  }, [])

  const value: DashboardConfigContextType = {
    config,
    isLoading,
    vertical,
    setVertical,
    updateConfig,
    refresh: fetchConfig,
  }

  return (
    <DashboardConfigContext.Provider value={value}>
      {children}
    </DashboardConfigContext.Provider>
  )
}

export function useDashboardConfig() {
  const ctx = useContext(DashboardConfigContext)
  if (!ctx) {
    throw new Error('useDashboardConfig must be used within DashboardConfigProvider')
  }
  return ctx
}

export function useDashboardConfigOptional() {
  return useContext(DashboardConfigContext)
}
