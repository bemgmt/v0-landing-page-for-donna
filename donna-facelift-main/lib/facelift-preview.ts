const missingSupabase =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY

export const isFaceliftPreview =
  process.env.FACELIFT_PREVIEW === 'true' ||
  (!!process.env.VERCEL && process.env.NODE_ENV === 'production' && missingSupabase)

export const FACELIFT_PREVIEW_MESSAGE =
  'This Supabase-backed feature is disabled in the facelift preview build.'

