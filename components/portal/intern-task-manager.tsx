"use client"

import { useState, useTransition } from "react"
import { addInternTask, removeInternTask } from "@/app/portal/intern/admin-actions"
import { Trash2, Plus } from "lucide-react"

type InternTask = {
  id: string
  week: number
  label: string
  completed: boolean
}

type Props = {
  internId: string
  internName: string
  tasks: InternTask[]
}

export function InternTaskManager({ internId, internName, tasks }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [week, setWeek] = useState(1)
  const [label, setLabel] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    if (!label.trim()) return
    setError(null)
    
    startTransition(async () => {
      const result = await addInternTask(internId, week, label)
      if (result.success) {
        setLabel("")
      } else {
        setError(result.error || "Failed to add task")
      }
    })
  }

  const handleDelete = (taskId: string) => {
    startTransition(async () => {
      const result = await removeInternTask(internId, taskId)
      if (!result.success) {
        setError(result.error || "Failed to remove task")
      }
    })
  }

  // Group tasks by week
  const tasksByWeek = tasks.reduce((acc, task) => {
    if (!acc[task.week]) acc[task.week] = []
    acc[task.week].push(task)
    return acc
  }, {} as Record<number, InternTask[]>)

  const sortedWeeks = Object.keys(tasksByWeek).map(Number).sort((a, b) => a - b)

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-cyan-400 hover:text-cyan-300 mb-2"
      >
        {isOpen ? "Hide Task Manager" : "Manage Tasks"}
      </button>

      {isOpen && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 p-3 bg-black/40 rounded-lg border border-white/5">
            <h4 className="text-sm font-medium">Assign New Task</h4>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={week}
                onChange={(e) => setWeek(parseInt(e.target.value) || 1)}
                className="w-20 rounded bg-black/40 border border-white/15 px-2 py-1 text-xs"
                placeholder="Week"
                disabled={isPending}
              />
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="flex-1 rounded bg-black/40 border border-white/15 px-2 py-1 text-xs"
                placeholder="Task description..."
                disabled={isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd()
                }}
              />
              <button
                onClick={handleAdd}
                disabled={isPending || !label.trim()}
                className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs hover:bg-cyan-500/30 disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {sortedWeeks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tasks assigned yet.</p>
            ) : (
              sortedWeeks.map(w => (
                <div key={w}>
                  <h5 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Week {w}</h5>
                  <ul className="space-y-2">
                    {tasksByWeek[w].map(task => (
                      <li key={task.id} className="flex items-center justify-between group rounded p-2 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${task.completed ? "bg-cyan-500" : "bg-white/20"}`} />
                          <span className={`text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {task.label}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={isPending}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 disabled:opacity-50 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
