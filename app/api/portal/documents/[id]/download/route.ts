import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { supabase } = session
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, storage_path, title")
    .eq("id", id)
    .maybeSingle()

  if (error || !doc?.storage_path) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from("portal-documents")
    .createSignedUrl(doc.storage_path, 120)

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not sign download URL" }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
