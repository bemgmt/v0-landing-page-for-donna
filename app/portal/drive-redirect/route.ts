import { getPortalSession } from "@/lib/portal/session"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await getPortalSession()
  
  if (!session) {
    return NextResponse.redirect(new URL("/login?next=/portal", request.url))
  }

  const { user, profile } = session
  
  const searchParams = new URLSearchParams()
  searchParams.set("user_id", user.id)
  searchParams.set("email", user.email || "")
  searchParams.set("name", profile.display_name || user.email?.split("@")[0] || "User")
  
  if (profile.company_name) {
    searchParams.set("company", profile.company_name)
  }

  const url = `https://www.donna.business/drive/auto-join?${searchParams.toString()}`
  return NextResponse.redirect(url)
}
