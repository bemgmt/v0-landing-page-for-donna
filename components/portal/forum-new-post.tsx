"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type Category = { id: string; title: string; slug: string }

export default function ForumNewPost({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [pending, setPending] = useState(false)

  async function submit() {
    if (!categoryId) return
    setPending(true)
    const res = await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id: categoryId, title, body_md: body }),
      credentials: "same-origin",
    })
    const data = (await res.json()) as { post?: { slug?: string }; error?: unknown }
    setPending(false)
    if (res.ok && data.post?.slug) {
      router.push(`/portal/forum/${data.post.slug}`)
      router.refresh()
      return
    }
    window.alert("Could not create post.")
  }

  return (
    <div className="rounded-xl border border-white/10 liquid-glass p-4 space-y-3">
      <p className="text-sm font-medium">New post</p>
      <label className="block text-xs text-muted-foreground">
        Category
        <select
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted-foreground">
        Title
        <input
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="block text-xs text-muted-foreground">
        Body (markdown-ish text)
        <textarea
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm min-h-[100px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={pending || title.trim().length < 2 || !hasCategories}
        onClick={() => void submit()}
        className="rounded-lg animated-edge-button px-4 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Posting…" : "Publish"}
      </button>
    </div>
  )
}
