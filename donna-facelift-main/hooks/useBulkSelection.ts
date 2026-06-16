import { useState, useCallback, useEffect } from 'react'

// Simple toast fallback
const toast = (options: { title: string; description: string; variant?: string }) => {
  console.log(`${options.title}: ${options.description}`)
}

interface UseBulkSelectionReturn {
  selectedIds: Set<string>
  selectAll: () => void
  selectNone: () => void
  toggleSelection: (id: string) => void
  isSelected: (id: string) => boolean
  selectionCount: number
  hasSelection: boolean
  isAllSelected: boolean
  isPartiallySelected: boolean
  selectRange: (startId: string, endId: string) => void
  selectByFilter: (filterFn: (id: string) => boolean) => void
  invertSelection: () => void
  maxSelection: number
  availableCount: number
}

interface UseBulkSelectionOptions {
  maxSelection?: number
  persistKey?: string
  onSelectionChange?: (selectedIds: Set<string>) => void
}

export function useBulkSelection(
  availableIds: string[] = [],
  options: UseBulkSelectionOptions = {}
): UseBulkSelectionReturn {
  const { maxSelection = 1000, persistKey, onSelectionChange } = options
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Load from localStorage if persistKey is provided
    if (persistKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`bulk-selection-${persistKey}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          return new Set(parsed.filter((id: string) => availableIds.includes(id)))
        }
      } catch (error) {
        console.warn('Failed to load persisted selection:', error)
      }
    }
    return new Set<string>()
  })

  // Persist selection to localStorage
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `bulk-selection-${persistKey}`,
          JSON.stringify(Array.from(selectedIds))
        )
      } catch (error) {
        console.warn('Failed to persist selection:', error)
      }
    }
  }, [selectedIds, persistKey])

  // Clean up selection when available IDs change
  useEffect(() => {
    setSelectedIds(prev => {
      const filtered = new Set(Array.from(prev).filter(id => availableIds.includes(id)))
      return filtered.size !== prev.size ? filtered : prev
    })
  }, [availableIds])

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(selectedIds)
  }, [selectedIds, onSelectionChange])

  const selectAll = useCallback(() => {
    if (availableIds.length > maxSelection) {
      toast({
        title: 'Selection Limit',
        description: `Cannot select more than ${maxSelection} items at once.`,
        variant: 'destructive'
      })
      return
    }
    
    setSelectedIds(new Set(availableIds))
    toast({
      title: 'All Selected',
      description: `Selected ${availableIds.length} items.`
    })
  }, [availableIds, maxSelection])

  const selectNone = useCallback(() => {
    setSelectedIds(new Set())
    toast({
      title: 'Selection Cleared',
      description: 'All items deselected.'
    })
  }, [])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev)
      
      if (newSelection.has(id)) {
        newSelection.delete(id)
      } else {
        if (newSelection.size >= maxSelection) {
          toast({
            title: 'Selection Limit Reached',
            description: `Cannot select more than ${maxSelection} items.`,
            variant: 'destructive'
          })
          return prev
        }
        newSelection.add(id)
      }
      
      return newSelection
    })
  }, [maxSelection])

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id)
  }, [selectedIds])

  const selectRange = useCallback((startId: string, endId: string) => {
    const startIndex = availableIds.indexOf(startId)
    const endIndex = availableIds.indexOf(endId)
    
    if (startIndex === -1 || endIndex === -1) return
    
    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    const rangeIds = availableIds.slice(start, end + 1)
    
    if (selectedIds.size + rangeIds.length > maxSelection) {
      toast({
        title: 'Selection Limit',
        description: `Cannot select more than ${maxSelection} items.`,
        variant: 'destructive'
      })
      return
    }
    
    setSelectedIds(prev => {
      const newSelection = new Set(prev)
      rangeIds.forEach(id => newSelection.add(id))
      return newSelection
    })
  }, [availableIds, selectedIds.size, maxSelection])

  const selectByFilter = useCallback((filterFn: (id: string) => boolean) => {
    const filteredIds = availableIds.filter(filterFn)
    
    if (selectedIds.size + filteredIds.length > maxSelection) {
      toast({
        title: 'Selection Limit',
        description: `Cannot select more than ${maxSelection} items.`,
        variant: 'destructive'
      })
      return
    }
    
    setSelectedIds(prev => {
      const newSelection = new Set(prev)
      filteredIds.forEach(id => newSelection.add(id))
      return newSelection
    })
    
    toast({
      title: 'Filtered Selection',
      description: `Selected ${filteredIds.length} items matching criteria.`
    })
  }, [availableIds, selectedIds.size, maxSelection])

  const invertSelection = useCallback(() => {
    const unselectedIds = availableIds.filter(id => !selectedIds.has(id))
    
    if (unselectedIds.length > maxSelection) {
      toast({
        title: 'Selection Limit',
        description: `Cannot select more than ${maxSelection} items.`,
        variant: 'destructive'
      })
      return
    }
    
    setSelectedIds(new Set(unselectedIds))
    toast({
      title: 'Selection Inverted',
      description: `Selected ${unselectedIds.length} items.`
    })
  }, [availableIds, selectedIds, maxSelection])

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'a':
          event.preventDefault()
          selectAll()
          break
        case 'd':
          event.preventDefault()
          selectNone()
          break
        case 'i':
          event.preventDefault()
          invertSelection()
          break
      }
    } else if (event.key === 'Escape') {
      selectNone()
    }
  }, [selectAll, selectNone, invertSelection])

  // Set up keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const selectionCount = selectedIds.size
  const hasSelection = selectionCount > 0
  const isAllSelected = availableIds.length > 0 && selectionCount === availableIds.length
  const isPartiallySelected = hasSelection && !isAllSelected

  return {
    selectedIds,
    selectAll,
    selectNone,
    toggleSelection,
    isSelected,
    selectionCount,
    hasSelection,
    isAllSelected,
    isPartiallySelected,
    selectRange,
    selectByFilter,
    invertSelection,
    maxSelection,
    availableCount: availableIds.length
  }
}

// Extended return type with additional methods
export interface ExtendedUseBulkSelectionReturn extends UseBulkSelectionReturn {
  isAllSelected: boolean
  isPartiallySelected: boolean
  selectRange: (startId: string, endId: string) => void
  selectByFilter: (filterFn: (id: string) => boolean) => void
  invertSelection: () => void
  maxSelection: number
  availableCount: number
}

// Hook for managing bulk selection with undo functionality
export function useBulkSelectionWithUndo(
  availableIds: string[] = [],
  options: UseBulkSelectionOptions = {}
) {
  const bulkSelection = useBulkSelection(availableIds, options) as ExtendedUseBulkSelectionReturn
  const [selectionHistory, setSelectionHistory] = useState<Set<string>[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Save selection state to history
  const saveToHistory = useCallback((selection: Set<string>) => {
    setSelectionHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(new Set(selection))
      return newHistory.slice(-10) // Keep last 10 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 9))
  }, [historyIndex])

  // Undo last selection change
  const undoSelection = useCallback(() => {
    if (historyIndex > 0) {
      const previousSelection = selectionHistory[historyIndex - 1]
      bulkSelection.selectedIds.clear()
      previousSelection.forEach(id => bulkSelection.selectedIds.add(id))
      setHistoryIndex(prev => prev - 1)
      
      toast({
        title: 'Selection Undone',
        description: 'Reverted to previous selection state.'
      })
    }
  }, [historyIndex, selectionHistory, bulkSelection.selectedIds])

  // Redo selection change
  const redoSelection = useCallback(() => {
    if (historyIndex < selectionHistory.length - 1) {
      const nextSelection = selectionHistory[historyIndex + 1]
      bulkSelection.selectedIds.clear()
      nextSelection.forEach(id => bulkSelection.selectedIds.add(id))
      setHistoryIndex(prev => prev + 1)
      
      toast({
        title: 'Selection Redone',
        description: 'Restored next selection state.'
      })
    }
  }, [historyIndex, selectionHistory, bulkSelection.selectedIds])

  // Override selection methods to save to history
  const selectAllWithHistory = useCallback(() => {
    saveToHistory(new Set(bulkSelection.selectedIds))
    bulkSelection.selectAll()
  }, [bulkSelection, saveToHistory])

  const selectNoneWithHistory = useCallback(() => {
    saveToHistory(new Set(bulkSelection.selectedIds))
    bulkSelection.selectNone()
  }, [bulkSelection, saveToHistory])

  const toggleSelectionWithHistory = useCallback((id: string) => {
    saveToHistory(new Set(bulkSelection.selectedIds))
    bulkSelection.toggleSelection(id)
  }, [bulkSelection, saveToHistory])

  return {
    ...bulkSelection,
    selectAll: selectAllWithHistory,
    selectNone: selectNoneWithHistory,
    toggleSelection: toggleSelectionWithHistory,
    undoSelection,
    redoSelection,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < selectionHistory.length - 1
  }
}
