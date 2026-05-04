import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { generateVertexAsset, type AssetType } from "@/lib/flow/client"

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
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  try {
    const { bytesBase64Encoded, mimeType } = await generateVertexAsset({
      prompt: json.prompt,
      type: json.type,
      dimensions: json.dimensions,
      duration: json.duration,
      aspectRatio: json.aspectRatio,
      style: json.style,
    })

    // Upload to Supabase marketing-assets bucket
    const buffer = Buffer.from(bytesBase64Encoded, "base64")
    const ext = mimeType.split("/")[1] ?? "jpg"
    const filename = `${crypto.randomUUID()}.${ext}`

    const { data: uploadData, error: uploadError } = await session.supabase
      .storage
      .from("marketing-assets")
      .upload(filename, buffer, {
        contentType: mimeType,
      })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = session.supabase
      .storage
      .from("marketing-assets")
      .getPublicUrl(filename)

    const asset = {
      id: filename,
      type: json.type,
      prompt: json.prompt,
      url: publicUrlData.publicUrl,
      mimeType,
      createdAt: new Date().toISOString(),
      metadata: { dimensions: json.dimensions, duration: json.duration },
    }

    return NextResponse.json({ asset })
  } catch (err: any) {
    console.error("[flow/generate]", err)
    return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 })
  }
}
