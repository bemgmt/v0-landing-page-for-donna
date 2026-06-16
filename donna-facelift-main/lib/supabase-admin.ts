import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazily initialize to avoid build-time crashes when env is not provided
export const supabaseAdmin: SupabaseClient | undefined = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : undefined

export function getSupabaseAdminOrThrow(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const reason = !url || !key ? 'missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' : 'client not initialized'
  throw new Error(`Supabase admin client unavailable: ${reason}`)
}

export function getSupabaseAdmin(): SupabaseClient | undefined {
  return supabaseAdmin
}
