import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { listWorkspaceAssets } from "@/lib/flow/client"

export async function GET() {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isStaff = session.profile.role === "staff" || session.profile.role === "admin"
  if (!isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const assets = await listWorkspaceAssets()
    return NextResponse.json({ assets })
  } catch (err: any) {
    console.error("[flow/assets]", err)
    return NextResponse.json({ error: err.message ?? "Failed to list assets" }, { status: 500 })
  }
}
