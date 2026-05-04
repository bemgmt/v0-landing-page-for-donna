import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { queryPerformance } from "@/lib/seo/gsc-client"

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
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const dimensions = searchParams.get("dimensions")?.split(",") as
    | ("query" | "page" | "country" | "device" | "date")[]
    | undefined

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Missing startDate or endDate" }, { status: 400 })
  }

  try {
    const data = await queryPerformance({
      startDate,
      endDate,
      dimensions: dimensions ?? ["query"],
      rowLimit: 100,
    })

    return NextResponse.json(data)
  } catch (err: any) {
    console.error("[seo/performance]", err)
    return NextResponse.json({ error: err.message ?? "GSC query failed" }, { status: 500 })
  }
}
