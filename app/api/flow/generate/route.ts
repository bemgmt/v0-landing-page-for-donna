import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { generateVertexAsset, type AssetType } from "@/lib/flow/client"

export const maxDuration = 900 // Set maximum runtime to 15 minutes to support Veo video generation window

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
    const { data, error } = await session.supabase
      .from("marketing_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60)

    if (error) throw error

    // Normalize fields for UI mapping (camelCase matches flow-studio client mapping)
    const mappedAssets = (data || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      prompt: item.prompt,
      optimizedPrompt: item.optimized_prompt,
      url: item.url,
      mimeType: item.mime_type,
      createdAt: item.created_at,
      metadata: item.metadata
    }))

    return NextResponse.json({ assets: mappedAssets })
  } catch (err: any) {
    console.error("[flow/generate/get]", err)
    return NextResponse.json({ error: err.message ?? "Failed to fetch assets history" }, { status: 500 })
  }
}

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
    const genResult = await generateVertexAsset({
      prompt: json.prompt,
      type: json.type,
      dimensions: json.dimensions,
      duration: json.duration,
      aspectRatio: json.aspectRatio,
      style: json.style,
    })

    let finalUrl = "processing"
    let mimeType = json.type === "video" ? "video/mp4" : "image/jpeg"
    let metadata: Record<string, any> = {
      dimensions: json.dimensions,
      duration: json.duration,
      aspectRatio: json.aspectRatio,
    }

    if (genResult.status === "sync") {
      // Sync Upload: Write directly into Object Storage
      const buffer = Buffer.from(genResult.bytesBase64Encoded, "base64")
      mimeType = genResult.mimeType
      const ext = mimeType.split("/")[1] ?? "jpg"
      const filename = `${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await session.supabase
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

      finalUrl = publicUrlData.publicUrl
      metadata.status = "completed"
    } else {
      // Async Workflow: Record cloud state tokens in metadata payload
      metadata.status = "processing"
      metadata.operationName = genResult.operationName
    }

    // Record index row in Supabase relational store
    const { data: dbRow, error: dbError } = await session.supabase
      .from("marketing_assets")
      .insert({
        creator_profile_id: session.profile.id,
        type: json.type,
        prompt: json.prompt,
        optimized_prompt: genResult.optimizedPrompt,
        url: finalUrl,
        mime_type: mimeType,
        metadata,
      })
      .select()
      .single()

    if (dbError) {
      console.error("[flow/generate] Relational Insert Error:", dbError)
      throw new Error(`Relational persistence failure: ${dbError.message}`)
    }

    const asset = {
      id: dbRow.id,
      type: json.type,
      prompt: json.prompt,
      optimizedPrompt: genResult.optimizedPrompt,
      url: finalUrl,
      mimeType,
      createdAt: dbRow.created_at,
      metadata: dbRow.metadata,
    }

    return NextResponse.json({ asset, status: metadata.status })
  } catch (err: any) {
    console.error("[flow/generate] Fatal pipeline handler catch:", err)
    return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 })
  }
}

