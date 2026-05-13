import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"
import { checkVertexOperation } from "@/lib/flow/client"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 })
  }

  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch the asset from relational DB
    const { data: asset, error: fetchErr } = await session.supabase
      .from("marketing_assets")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchErr || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    const meta = asset.metadata || {}

    // Case 1: Asset already processed/finalized previously
    if (meta.status !== "processing" && asset.url !== "processing") {
      return NextResponse.json({
        status: meta.status || "completed",
        asset: {
          id: asset.id,
          type: asset.type,
          prompt: asset.prompt,
          optimizedPrompt: asset.optimized_prompt,
          url: asset.url,
          mimeType: asset.mime_type,
          createdAt: asset.created_at,
          metadata: meta
        }
      })
    }

    const operationName = meta.operationName
    if (!operationName) {
      return NextResponse.json({ error: "No background operation reference found in asset" }, { status: 400 })
    }

    // Case 2: Query Cloud Operation Progress (Single non-blocking lookup)
    console.log(`[ClearCopy] Checking status for Job: ${operationName}...`)
    const poll = await checkVertexOperation(operationName)

    // 2a: Still running in background cloud queue
    if (!poll.done) {
      return NextResponse.json({ status: "processing" })
    }

    // 2b: Background job returned direct error
    if (poll.error) {
      console.error(`[ClearCopy] Asynchronous job reported failure: ${poll.error}`)
      const updatedMeta = { ...meta, status: "failed", error: poll.error }
      await session.supabase
        .from("marketing_assets")
        .update({ metadata: updatedMeta, url: "failed" })
        .eq("id", id)

      return NextResponse.json({ status: "failed", error: poll.error })
    }

    // 2c: Success - Download, convert, and commit to local infrastructure
    const { bytesBase64Encoded, mimeType } = poll
    if (!bytesBase64Encoded) {
      throw new Error("Operation signaled complete but bytes missing from extraction pipeline.")
    }

    console.log(`[ClearCopy] Job finished. Downloading and converting video payload to persistent store...`)
    const buffer = Buffer.from(bytesBase64Encoded, "base64")
    const ext = mimeType?.split("/")[1] ?? "mp4"
    const filename = `${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await session.supabase
      .storage
      .from("marketing-assets")
      .upload(filename, buffer, {
        contentType: mimeType || "video/mp4",
      })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = session.supabase
      .storage
      .from("marketing-assets")
      .getPublicUrl(filename)

    const finalUrl = publicUrlData.publicUrl
    const updatedMeta = { ...meta, status: "completed", completedAt: new Date().toISOString() }

    // Final database commit
    const { data: updatedRow, error: updateErr } = await session.supabase
      .from("marketing_assets")
      .update({
        url: finalUrl,
        mime_type: mimeType || "video/mp4",
        metadata: updatedMeta
      })
      .eq("id", id)
      .select()
      .single()

    if (updateErr) throw updateErr

    console.log(`[ClearCopy] Background resolution complete for Asset: ${id}`)
    return NextResponse.json({
      status: "completed",
      asset: {
        id: updatedRow.id,
        type: updatedRow.type,
        prompt: updatedRow.prompt,
        optimizedPrompt: updatedRow.optimized_prompt,
        url: finalUrl,
        mimeType: updatedRow.mime_type,
        createdAt: updatedRow.created_at,
        metadata: updatedMeta
      }
    })
  } catch (err: any) {
    console.error("[flow/check-status] Exception resolution catch:", err)
    return NextResponse.json({ error: err.message || "Internal resolver crash" }, { status: 500 })
  }
}
