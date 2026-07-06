"use client"

import { useState, useTransition } from "react"
import { Check } from "lucide-react"
import { saveInternTasks } from "@/app/portal/intern/actions"

export const defaultTasks = [
  { id: "email", label: "Set up company email" },
  { id: "drive", label: "Access Shared drive (Interns - Summer 2026)" },
  { id: "slack", label: "Join Slack #interns channel" },
  { id: "product", label: "Set up DONNA product account" },
  { id: "calendar", label: "Review recurring calendar invites" },
  { id: "library", label: "Confirm access to USC Marshall library databases" },
  { id: "nda", label: "Sign internship agreement and NDA" },
  { id: "expectations", label: "Review one-page ways of working expectations" },
  { id: "plan", label: "Draft week 1 research plan" },
]

export function InternChecklist({ initialTasks }: { initialTasks?: Record<string, boolean> | null }) {
  const [completed, setCompleted] = useState<Record<string, boolean>>(initialTasks || {})
  const [isPending, startTransition] = useTransition()

  const toggleTask = (id: string) => {
    const next = { ...completed, [id]: !completed[id] }
    setCompleted(next)
    
    startTransition(() => {
      saveInternTasks(next)
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Onboarding Checklist</h3>
        {isPending && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
      </div>
      <ul className="space-y-3">
        {defaultTasks.map((task) => {
          const isDone = !!completed[task.id]
          return (
            <li key={task.id} className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border ${
                  isDone
                    ? "bg-cyan-500 border-cyan-500 text-black"
                    : "border-white/20 bg-transparent text-transparent hover:border-cyan-500/50"
                } transition-colors`}
                aria-label={isDone ? "Mark as incomplete" : "Mark as complete"}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
              <span className={`text-sm ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {task.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
