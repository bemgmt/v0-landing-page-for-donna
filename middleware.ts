import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  if (request.nextUrl.hostname.toLowerCase() === "www.aidonna.co") {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.protocol = "https:"
    canonicalUrl.hostname = "aidonna.co"
    canonicalUrl.port = ""
    return NextResponse.redirect(canonicalUrl, 308)
  }

  const response = NextResponse.next()
  if (process.env.VERCEL_ENV === "preview") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
  }
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
