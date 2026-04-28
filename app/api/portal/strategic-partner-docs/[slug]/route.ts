import { readFile } from "node:fs/promises"
import { NextResponse } from "next/server"
import { hasPartnerCapabilities } from "@/lib/auth/roles"
import { getPortalSession } from "@/lib/portal/session"
import {
  getStrategicPartnerDocBySlug,
  getStrategicPartnerDocPath,
  STRATEGIC_PARTNER_DOC_SLUGS,
} from "@/lib/portal/strategic-partner-docs"

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!STRATEGIC_PARTNER_DOC_SLUGS.includes(slug as (typeof STRATEGIC_PARTNER_DOC_SLUGS)[number])) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasPartnerCapabilities(session.profile.role, session.subscriptionActive)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const meta = getStrategicPartnerDocBySlug(slug)
  if (!meta) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const filePath = getStrategicPartnerDocPath(meta.filename)
    const body = await readFile(filePath, "utf8")
    const safeName = `${meta.slug}.md`
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "File not available" }, { status: 500 })
  }
}
