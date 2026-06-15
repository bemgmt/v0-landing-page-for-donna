import { Buffer } from "node:buffer"
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import {
  businessCardExtractionSchema,
  type BusinessCardExtraction,
} from "@/lib/card-scanner/card-scan-schema"
import { CARD_SCAN_MODEL } from "@/lib/card-scanner/extract-card"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const saveBodySchema = z.object({
  lead: businessCardExtractionSchema,
  ocr_markdown: z.string().optional().nullable(),
  event_tag: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
})

function parseImageForUpload(
  image: string | null | undefined
): { buffer: Buffer; contentType: string } | null {
  if (!image || !image.trim()) return null
  const m = image.match(/^data:([^;]+);base64,(.+)$/s)
  if (m) {
    return {
      buffer: Buffer.from(m[2].replace(/\s/g, ""), "base64"),
      contentType: m[1],
    }
  }
  return {
    buffer: Buffer.from(image.replace(/\s/g, ""), "base64"),
    contentType: "image/jpeg",
  }
}

function rowFromLead(lead: BusinessCardExtraction) {
  return {
    full_name: lead.full_name || null,
    company: lead.company || null,
    job_title: lead.job_title || null,
    primary_email: lead.email?.trim() || null,
    phone: lead.phone?.trim() || null,
    website: lead.website || null,
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = saveBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { lead, ocr_markdown, event_tag, image } = parsed.data

    // Authenticate and get the admin user's profile
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await authClient
      .from("member_profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const scanned_by = profile.id
    const supabase = createAdminClient()

    const insertRow = {
      ...rowFromLead(lead),
      ocr_markdown: ocr_markdown ?? null,
      event_tag: event_tag ?? null,
      extraction_model: CARD_SCAN_MODEL,
      image_storage_path: null as string | null,
      scanned_by,
    }

    const { data: inserted, error: insertError } = await supabase
      .from("business_card_leads")
      .insert(insertRow)
      .select("id")
      .single()

    if (insertError) throw insertError

    const leadId = inserted.id
    let imagePath: string | null = null

    // Upload card image to storage
    const upload = parseImageForUpload(image ?? undefined)
    if (
      upload &&
      upload.buffer.length > 0 &&
      upload.buffer.length <= 10 * 1024 * 1024
    ) {
      const ext = upload.contentType.includes("png") ? "png" : "jpg"
      const objectPath = `${leadId}/${randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("business-cards")
        .upload(objectPath, upload.buffer, {
          contentType: upload.contentType,
          upsert: false,
        })
      if (!upErr) {
        imagePath = objectPath
        await supabase
          .from("business_card_leads")
          .update({ image_storage_path: imagePath })
          .eq("id", leadId)
      }
    }

    return NextResponse.json({
      success: true,
      id: leadId,
      image_storage_path: imagePath,
      can_share: true,
    })
  } catch (e) {
    console.error("[card-scanner save]", e)
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 })
  }
}
