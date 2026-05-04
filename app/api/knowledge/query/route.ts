import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { queryNotebook } from "@/lib/notebooklm/client"

export async function POST(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isStaff = session.profile.role === "staff" || session.profile.role === "admin"
  if (!isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const json = await request.json().catch(() => null)
  if (!json?.question) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 })
  }

  try {
    const result = await queryNotebook(json.question, json.notebookId)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error("[knowledge/query]", err)
    return NextResponse.json({ error: err.message ?? "Query failed" }, { status: 500 })
  }
}
