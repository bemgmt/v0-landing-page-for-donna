import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createDisabledClient(): SupabaseClient {
  return new Proxy(
    {},
    {
      get() {
        throw new Error('Supabase client disabled for facelift preview (no Supabase data available).')
      },
    }
  ) as SupabaseClient
}

export const supabase: SupabaseClient =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createDisabledClient()
