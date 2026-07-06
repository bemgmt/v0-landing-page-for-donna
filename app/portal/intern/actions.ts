"use server"

import { getPortalSession } from "@/lib/portal/session"

export async function saveInternTasks(tasks: Record<string, boolean>) {
  const session = await getPortalSession()
  if (!session) return { success: false, error: "Not logged in" }
  
  const { profile, supabase } = session
  if (profile.role !== "intern" && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("member_profiles")
    .update({ intern_tasks: tasks, updated_at: new Date().toISOString() })
    .eq("id", profile.id)

  if (error) {
    console.error("[intern/actions] saveInternTasks error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
