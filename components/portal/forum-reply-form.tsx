"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function ForumReplyForm({ postId }: { postId: string }) {
  const router = useRouter()
  const [body, setBody] = useState("")
  const [pending, setPending] = useState(false)

  async function submit() {
    setPending(true)
    const res = await fetch("/api/forum/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, body_md: body }),
      credentials: "same-origin",
    })
    setPending(false)
    if (res.ok) {
      setBody("")
      router.refresh()
      return
    }
    window.alert("Could not post reply.")
  }

  return (
    <div className="rounded-xl border border-white/10 liquid-glass p-4 space-y-3">
      <p className="text-sm font-medium">Reply</p>
      <textarea
        className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm min-h-[80px]"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        type="button"
        disabled={pending || body.trim().length < 1}
        onClick={() => void submit()}
        className="rounded-lg animated-edge-button px-4 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Posting…" : "Post reply"}
      </button>
    </div>
  )
}
