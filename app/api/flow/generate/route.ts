import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { generateAsset, type AssetType } from "@/lib/flow/client"

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
  if (!json?.prompt || !json?.type) {
    return NextResponse.json({ error: "Missing prompt or type" }, { status: 400 })
  }

  const validTypes: AssetType[] = ["image", "video"]
  if (!validTypes.includes(json.type)) {
    return NextResponse.json({ error: "Invalid type — must be 'image' or 'video'" }, { status: 400 })
  }

  try {
    const asset = await generateAsset({
      prompt: json.prompt,
      type: json.type,
      dimensions: json.dimensions,
      duration: json.duration,
      aspectRatio: json.aspectRatio,
      style: json.style,
    })

    return NextResponse.json({ asset })
  } catch (err: any) {
    console.error("[flow/generate]", err)
    return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 })
  }
}
