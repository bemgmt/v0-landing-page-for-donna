"use server"

import { getPortalSession } from "@/lib/portal/session"

export async function toggleInternTask(taskId: string, completed: boolean) {
  const session = await getPortalSession()
  if (!session) return { success: false, error: "Not logged in" }
  
  const { profile, supabase } = session
  if (profile.role !== "intern" && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized" }
  }

  const currentTasks = profile.intern_tasks?.tasks || []
  const newTasks = currentTasks.map(t => t.id === taskId ? { ...t, completed } : t)

  const { error } = await supabase
    .from("member_profiles")
    .update({ intern_tasks: { tasks: newTasks }, updated_at: new Date().toISOString() })
    .eq("id", profile.id)

  if (error) {
    console.error("[intern/actions] toggleInternTask error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
