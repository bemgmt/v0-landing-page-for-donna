import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireStaffOrAdmin } from "@/lib/auth/require-staff"
import AuthDiagnosticsClient from "./client"

export const metadata: Metadata = {
  title: "Auth Diagnostics | Admin",
  robots: { index: false, follow: false },
}

export default async function AuthDiagnosticsPage() {
  const session = await requireStaffOrAdmin()
  if (!session || session.profile.role !== "admin") {
    redirect("/")
  }

  return (
    <main className="min-h-screen bg-black">
      <AuthDiagnosticsClient />
    </main>
  )
}
