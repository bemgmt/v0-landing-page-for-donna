import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { generateVertexAsset, type AssetType } from "@/lib/flow/client"

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
    const { bytesBase64Encoded, mimeType, optimizedPrompt } = await generateVertexAsset({
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

    const finalUrl = publicUrlData.publicUrl

    // Save metadata to Supabase table public.marketing_assets
    const { data: dbRow, error: dbError } = await session.supabase
      .from("marketing_assets")
      .insert({
        creator_profile_id: session.profile.id,
        type: json.type,
        prompt: json.prompt,
        optimized_prompt: optimizedPrompt,
        url: finalUrl,
        mime_type: mimeType,
        metadata: { 
          dimensions: json.dimensions, 
          duration: json.duration,
          aspectRatio: json.aspectRatio,
        },
      })
      .select()
      .single()

    if (dbError) {
      console.error("[flow/generate] DB Insert warning (asset is generated and uploaded but not indexed in history):", dbError)
    }

    const asset = {
      id: dbRow?.id ?? filename,
      type: json.type,
      prompt: json.prompt,
      optimizedPrompt,
      url: finalUrl,
      mimeType,
      createdAt: dbRow?.created_at ?? new Date().toISOString(),
      metadata: { dimensions: json.dimensions, duration: json.duration },
    }

    return NextResponse.json({ asset })
  } catch (err: any) {
    console.error("[flow/generate]", err)
    return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 })
  }
}

