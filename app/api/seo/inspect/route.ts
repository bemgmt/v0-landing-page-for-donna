import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { inspectUrl } from "@/lib/seo/gsc-client"

export async function GET(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isStaff = session.profile.role === "staff" || session.profile.role === "admin"
  if (!isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  try {
    const result = await inspectUrl(url)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error("[seo/inspect]", err)
    return NextResponse.json({ error: err.message ?? "URL inspection failed" }, { status: 500 })
  }
}
