import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  let next = url.searchParams.get("next") ?? "/portal"
  if (!next.startsWith("/")) next = "/portal"

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(new URL(next, url.origin))
      }
    } catch (e) {
      console.error("[auth/callback]", e)
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin))
}
