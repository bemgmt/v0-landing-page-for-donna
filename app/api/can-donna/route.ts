import { NextResponse } from "next/server"
import { z } from "zod"
import { getPortalSession } from "@/lib/portal/session"

const bodySchema = z.object({
  question: z.string().min(3).max(8000),
})

type Verdict = "yes" | "partial" | "no" | "needs-human"

type StructuredAnswer = {
  verdict: Verdict
  summary: string
  why: string
  recommended_next_step: string
  offer_handoff: boolean
}

async function completeDonna(question: string): Promise<StructuredAnswer | null> {
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
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are DONNA's capability advisor for signed-in members. Answer in structured JSON only.
Keys: verdict ("yes"|"partial"|"no"|"needs-human"), summary (short), why (brief reasoning), recommended_next_step (actionable), offer_handoff (boolean, true if human staff should follow up).
Be concrete and avoid generic marketing language.`,
        },
        { role: "user", content: question },
      ],
    }),
  })

  if (!res.ok) return null

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const raw = json.choices?.[0]?.message?.content
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StructuredAnswer
    if (
      !parsed.verdict ||
      !parsed.summary ||
      !parsed.why ||
      !parsed.recommended_next_step ||
      typeof parsed.offer_handoff !== "boolean"
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const session = await getPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const structured = await completeDonna(parsed.data.question)
  if (!structured) {
    return NextResponse.json(
      {
        error: "AI is not configured. Set OPENAI_API_KEY on the server.",
        fallback: true,
      },
      { status: 503 },
    )
  }

  return NextResponse.json(structured)
}
