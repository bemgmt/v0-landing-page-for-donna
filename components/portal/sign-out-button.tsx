"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function SignOutButton() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
    setPending(false)
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={pending}
      className="text-sm text-muted-foreground hover:text-cyan-300 transition-colors disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  )
}
