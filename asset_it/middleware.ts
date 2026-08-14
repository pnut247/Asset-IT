import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE = "itam_session"

// Lightweight gate: presence of the session cookie. Full validation happens
// server-side in getCurrentUser(). Public paths bypass the check.
const PUBLIC_PATHS = ["/login", "/setup"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value)

  if (!isPublic && !hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Already logged in but visiting /login -> send to dashboard.
  if (pathname === "/login" && hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = "/"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Protect app pages; exclude API, static assets, and Next internals.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico)).*)"],
}
