"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"

type Props = {
  nextPath: string
}

export default function LoginForm({ nextPath }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setLoading(true)
    await signIn("cognito", { callbackUrl: nextPath })
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="rounded-lg animated-edge-button px-4 py-2 text-sm font-medium disabled:opacity-60 w-full"
      >
        {loading ? "Redirecting…" : "Continue to Sign In"}
      </button>
    </div>
  )
}
