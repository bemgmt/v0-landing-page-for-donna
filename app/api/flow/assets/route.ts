import { NextResponse } from "next/server"
import { getPortalSession } from "@/lib/portal/session"

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
    const { data: files, error } = await session.supabase
      .storage
      .from("marketing-assets")
      .list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      })

    if (error) throw error

    const assets = files
      .filter((file) => file.name !== ".emptyFolderPlaceholder")
      .map((file) => {
        const { data: publicUrlData } = session.supabase
          .storage
          .from("marketing-assets")
          .getPublicUrl(file.name)

        return {
          id: file.id || file.name,
          type: file.metadata?.mimetype?.startsWith("video") ? "video" : "image",
          prompt: "Supabase Asset",
          url: publicUrlData.publicUrl,
          mimeType: file.metadata?.mimetype ?? "image/jpeg",
          createdAt: file.created_at,
          metadata: file.metadata ?? {},
        }
      })

    return NextResponse.json({ assets })
  } catch (err: any) {
    console.error("[flow/assets]", err)
    return NextResponse.json({ error: err.message ?? "Failed to list assets" }, { status: 500 })
  }
}
