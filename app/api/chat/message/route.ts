import { NextResponse } from "next/server"
import { z } from "zod"
import { getPortalSession } from "@/lib/portal/session"

const bodySchema = z.object({
  session_id: z.string().uuid(),
  message: z.string().min(1).max(12000),
})

async function assistantReply(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey?.length) return null

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are DONNA support chat for logged-in members. Keep answers concise and actionable.",
        },
        { role: "user", content: prompt },
      ],
    }),
  })

  if (!res.ok) return null
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return json.choices?.[0]?.message?.content ?? null
}

export async function POST(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const jsonBody = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(jsonBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { session_id, message } = parsed.data

  const { data: chatSession, error: sessErr } = await session.supabase
    .from("chat_sessions")
    .select("id, status, member_profile_id")
    .eq("id", session_id)
    .maybeSingle()

  if (sessErr || !chatSession || chatSession.member_profile_id !== session.profile.id) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 })
  }

  await session.supabase.from("chat_messages").insert({
    session_id,
    role: "user",
    message,
    metadata: {},
  })

  if (chatSession.status !== "ai") {
    return NextResponse.json({ ok: true, assistant: null, mode: chatSession.status })
  }

  const text = await assistantReply(message)
  if (text) {
    await session.supabase.from("chat_messages").insert({
      session_id,
      role: "assistant",
      message: text,
      metadata: {},
    })
  }

  return NextResponse.json({
    ok: true,
    assistant: text,
    mode: chatSession.status,
    aiUnavailable: text === null,
  })
}
