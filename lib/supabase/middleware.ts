import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url?.length || !anon?.length) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if ((path.startsWith("/portal") || path.startsWith("/admin")) && !path.startsWith("/portal/unauthorized")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("next", path + request.nextUrl.search)
      return NextResponse.redirect(redirectUrl)
    }

    if (path.startsWith("/admin")) {
      const { data: profile } = await supabase
        .from("member_profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()

      const role = profile?.role as string | undefined
      if (!role || (role !== "staff" && role !== "admin")) {
        return NextResponse.redirect(new URL("/portal/unauthorized", request.url))
      }
    }
  }

  return supabaseResponse
}
