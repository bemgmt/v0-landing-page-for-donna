import { NextResponse } from "next/server"

// A shareable Google Calendar URL is not booking authorization.
// Keep bookings disabled until server-side Google OAuth and conflict checks are installed.
export async function POST() {
  return NextResponse.json({ error: "Booking is not yet enabled. Please contact DONNA to schedule." }, { status: 503 })
}
