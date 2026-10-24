import { NextResponse } from "next/server"

// Fail closed until Google Calendar OAuth credentials and token storage are configured.
// Never advertise unverified time slots as bookable.
export async function GET() {
  return NextResponse.json({ error: "Live availability is not configured." }, { status: 503 })
}
