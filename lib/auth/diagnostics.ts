import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export type AuthDiagnosticEvent = {
  event_name: string
  correlation_id: string
  environment: string
  is_success: boolean
  error_message?: string
  endpoint?: string
  has_session?: boolean
  has_access_token?: boolean
  has_authorization_header?: boolean
  redirect_host?: string
  cognito_client_id?: string
  subject_hash?: string
}

export async function logAuthEvent(event: AuthDiagnosticEvent) {
  try {
    // 1. Write structured JSON to stdout for hosting provider logs
    console.log(JSON.stringify({
      log_type: "auth_diagnostic",
      timestamp: new Date().toISOString(),
      ...event,
    }))

    // 2. Write to Supabase for the diagnostics UI
    const admin = createAdminClient()
    const { error } = await admin.from("auth_diagnostics").insert([
      {
        ...event,
        created_at: new Date().toISOString(),
      }
    ])

    if (error) {
      console.error("[auth-diagnostics] Failed to insert into Supabase:", error.message)
    }
  } catch (err) {
    console.error("[auth-diagnostics] Uncaught error logging auth event:", err)
  }
}
