"use client"

import { signOut as nextAuthSignOut } from "next-auth/react"
import { useState } from "react"

export default function SignOutButton() {
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    await nextAuthSignOut({ callbackUrl: "/" })
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
