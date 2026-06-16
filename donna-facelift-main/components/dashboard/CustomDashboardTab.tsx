"use client"

import { useState, useCallback, useMemo } from 'react'
import { Plus, SquarePen, Trash2, BarChart3, LayoutGrid, Table2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDashboardConfig, type DashboardWidget } from '@/contexts/DashboardConfigContext'

const WIDGET_TEMPLATES: { type: DashboardWidget['type']; label: string; icon: React.ReactNode }[] = [
  { type: 'stat', label: 'Stat Card', icon: <LayoutGrid className="w-4 h-4" /> },
  { type: 'table', label: 'Data Table', icon: <Table2 className="w-4 h-4" /> },
  { type: 'chart', label: 'Chart', icon: <BarChart3 className="w-4 h-4" /> },
]

function StatCardPlaceholder({ title }: { title: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-white/8">
          <LayoutGrid className="w-4 h-4 text-[var(--donna-cyan)]" />
        </div>
        <span className="text-xs text-white/50 uppercase tracking-wider font-medium">{title}</span>
      </div>
      <p className="text-2xl font-semibold text-white">—</p>
      <p className="text-xs text-white/40 mt-1">Add your metric</p>
    </div>
  )
}

function DataTablePlaceholder({ title }: { title: string }) {
  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Table2 className="w-4 h-4 text-[var(--donna-purple)]" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-white/3 border border-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[var(--donna-cyan)]" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="h-32 rounded-lg bg-white/3 border border-white/5 flex items-center justify-center">
        <span className="text-xs text-white/40">Chart placeholder</span>
      </div>
    </div>
  )
}

function WidgetCard({
  widget,
  onRename,
  onRemove,
  isEditing,
}: {
  widget: DashboardWidget
  onRename: (id: string, name: string) => void
  onRemove: (id: string) => void
  isEditing: boolean
}) {
  const [editName, setEditName] = useState(widget.customName ?? widget.type)
  const [isInputFocused, setIsInputFocused] = useState(false)

  const displayName = widget.customName || (widget.type === 'stat' ? 'Stat Card' : widget.type === 'table' ? 'Data Table' : 'Chart')

  const handleBlur = () => {
    setIsInputFocused(false)
    if (editName.trim()) onRename(widget.id, editName.trim())
  }

  return (
    <div className="group relative">
      {widget.type === 'stat' && <StatCardPlaceholder title={displayName} />}
      {widget.type === 'table' && <DataTablePlaceholder title={displayName} />}
      {widget.type === 'chart' && <ChartPlaceholder title={displayName} />}
      {isEditing && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onRemove(widget.id)}
            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            aria-label="Remove widget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {isEditing && (
        <div className="absolute bottom-2 left-2 right-2">
          {isInputFocused ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              autoFocus
              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-donna-purple"
              placeholder="Widget name"
            />
          ) : (
            <button
              onClick={() => setIsInputFocused(true)}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white w-full px-2 py-1 rounded hover:bg-white/5"
            >
              <SquarePen className="w-3 h-3" />
              {displayName}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function CustomDashboardTab() {
  const { config, updateConfig, isLoading } = useDashboardConfig()
  const [isEditing, setIsEditing] = useState(false)

  const widgets = useMemo(() => config?.widgets ?? [], [config?.widgets])

  const addWidget = useCallback(
    (type: DashboardWidget['type']) => {
      const id = `${type}-${Date.now()}`
      const newWidget: DashboardWidget = {
        id,
        type,
        customName: WIDGET_TEMPLATES.find((t) => t.type === type)?.label,
        order: widgets.length,
      }
      updateConfig({ widgets: [...widgets, newWidget] })
    },
    [widgets, updateConfig]
  )

  const renameWidget = useCallback(
    (id: string, name: string) => {
      updateConfig({
        widgets: widgets.map((w) => (w.id === id ? { ...w, customName: name } : w)),
      })
    },
    [widgets, updateConfig]
  )

  const removeWidget = useCallback(
    (id: string) => {
      updateConfig({ widgets: widgets.filter((w) => w.id !== id) })
    },
    [widgets, updateConfig]
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
            <div className="h-8 bg-white/10 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Tabs defaultValue="view" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="view" className="data-[state=active]:bg-white/10">
            View
          </TabsTrigger>
          <TabsTrigger value="customize" className="data-[state=active]:bg-white/10">
            Customize
          </TabsTrigger>
        </TabsList>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            isEditing ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-white/70 hover:text-white'
          }`}
        >
          {isEditing ? 'Done' : 'Edit layout'}
        </button>
      </div>

      <TabsContent value="view" className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {widgets.length === 0 ? (
            <div className="col-span-full p-8 rounded-xl bg-white/5 border border-white/10 border-dashed text-center text-white/50 text-sm">
              No widgets yet. Switch to &quot;Customize&quot; to add widgets.
            </div>
          ) : (
            widgets
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((w) => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  onRename={renameWidget}
                  onRemove={removeWidget}
                  isEditing={isEditing}
                />
              ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="customize" className="mt-4 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-white/90 mb-3">Add widgets</h3>
          <div className="flex flex-wrap gap-2">
            {WIDGET_TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => addWidget(t.type)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors text-white/80 hover:text-white"
              >
                <Plus className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-white/90 mb-3">Your widgets ({widgets.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {widgets.length === 0 ? (
              <p className="text-white/50 text-sm">Add widgets above to build your custom dashboard.</p>
            ) : (
              widgets.map((w) => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  onRename={renameWidget}
                  onRemove={removeWidget}
                  isEditing={true}
                />
              ))
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
