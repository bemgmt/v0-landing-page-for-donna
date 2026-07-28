import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-donna-request-path", `${request.nextUrl.pathname}${request.nextUrl.search}`)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
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
