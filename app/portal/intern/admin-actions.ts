"use server"

import { requireStaffOrAdmin } from "@/lib/auth/require-staff"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"
import { revalidatePath } from "next/cache"

export async function addInternTask(internId: string, week: number, label: string) {
  const session = await requireStaffOrAdmin()
  if (!session) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()
  
  // Fetch current tasks
  const { data: profile, error: fetchError } = await admin
    .from("member_profiles")
    .select("intern_tasks")
    .eq("id", internId)
    .maybeSingle()

  if (fetchError || !profile) {
    return { success: false, error: fetchError?.message || "Intern not found" }
  }

  const currentTasks = profile.intern_tasks?.tasks || []
  
  const newTask = {
    id: crypto.randomUUID(),
    week,
    label,
    completed: false
  }

  const newTasks = [...currentTasks, newTask]

  const { error: updateError } = await admin
    .from("member_profiles")
    .update({ intern_tasks: { tasks: newTasks }, updated_at: new Date().toISOString() })
    .eq("id", internId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath("/portal/intern")
  return { success: true }
}

export async function removeInternTask(internId: string, taskId: string) {
  const session = await requireStaffOrAdmin()
  if (!session) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()
  
  const { data: profile, error: fetchError } = await admin
    .from("member_profiles")
    .select("intern_tasks")
    .eq("id", internId)
    .maybeSingle()

  if (fetchError || !profile) {
    return { success: false, error: fetchError?.message || "Intern not found" }
  }

  const currentTasks = profile.intern_tasks?.tasks || []
  const newTasks = currentTasks.filter((t: any) => t.id !== taskId)

  const { error: updateError } = await admin
    .from("member_profiles")
    .update({ intern_tasks: { tasks: newTasks }, updated_at: new Date().toISOString() })
    .eq("id", internId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath("/portal/intern")
  return { success: true }
}
