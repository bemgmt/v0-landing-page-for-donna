import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  const code = url.searchParams.get("code")
  let next = url.searchParams.get("next") ?? "/portal"
  if (!next.startsWith("/")) next = "/portal"

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!code || !supabaseUrl?.length || !supabaseAnon?.length) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url))
  }

  let response = NextResponse.redirect(new URL(next, url.origin))

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.redirect(new URL(next, url.origin))
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error("[auth/callback]", error)
    const reason = encodeURIComponent(error.message || "exchange_failed")
    return NextResponse.redirect(new URL(`/login?error=oauth&reason=${reason}`, request.url))
  }

  return response
}
