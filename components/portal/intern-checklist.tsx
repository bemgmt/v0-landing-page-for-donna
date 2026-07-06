"use client"

import { useTransition, useOptimistic } from "react"
import { Check } from "lucide-react"
import { toggleInternTask } from "@/app/portal/intern/actions"

type InternTask = {
  id: string
  week: number
  label: string
  completed: boolean
}

export function InternChecklist({ tasks }: { tasks: InternTask[] }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticTasks, setOptimisticTask] = useOptimistic(
    tasks,
    (state, updatedTask: { id: string; completed: boolean }) =>
      state.map(t => (t.id === updatedTask.id ? { ...t, completed: updatedTask.completed } : t))
  )

  const handleToggle = (task: InternTask) => {
    const nextCompleted = !task.completed
    setOptimisticTask({ id: task.id, completed: nextCompleted })
    
    startTransition(() => {
      toggleInternTask(task.id, nextCompleted)
    })
  }

  const tasksByWeek = optimisticTasks.reduce((acc, task) => {
    if (!acc[task.week]) acc[task.week] = []
    acc[task.week].push(task)
    return acc
  }, {} as Record<number, InternTask[]>)

  const sortedWeeks = Object.keys(tasksByWeek).map(Number).sort((a, b) => a - b)

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Assigned Tasks</h3>
        {isPending && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
      </div>

      {sortedWeeks.length === 0 ? (
        <p className="text-sm text-muted-foreground">You have no assigned tasks yet.</p>
      ) : (
        <div className="space-y-6">
          {sortedWeeks.map(week => (
            <div key={week}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3 border-b border-white/10 pb-1">
                Week {week}
              </h4>
              <ul className="space-y-3">
                {tasksByWeek[week].map((task) => (
                  <li key={task.id} className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(task)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border ${
                        task.completed
                          ? "bg-cyan-500 border-cyan-500 text-black"
                          : "border-white/20 bg-transparent text-transparent hover:border-cyan-500/50"
                      } transition-colors`}
                      aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                    <span className={`text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {task.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

