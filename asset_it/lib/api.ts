import { NextResponse } from "next/server"
import { isDbConfigured } from "./db"

export function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** Wrap a route handler with consistent error handling. */
export function handleErrors(err: unknown) {
  // Any error carrying a numeric HTTP status (AuthError, AuthErrorLike, custom).
  if (err && typeof err === "object" && "status" in err && typeof (err as any).status === "number") {
    return errorResponse((err as Error).message, (err as any).status)
  }
  const message = err instanceof Error ? err.message : "Internal Server Error"
  // MySQL duplicate entry
  if (typeof message === "string" && message.includes("Duplicate entry")) {
    return errorResponse("A record with this unique value already exists.", 409)
  }
  console.log("[v0] API error:", message)
  return errorResponse(message, 500)
}

/** Guard used at the top of routes to give a clear message when the DB is not connected. */
export function assertDbConfigured() {
  if (!isDbConfigured()) {
    throw new AuthErrorLike(
      "Database is not configured. Add DATABASE_URL in Project Settings > Vars, then run the setup endpoint.",
      503,
    )
  }
}

// Small local error carrying a status without importing AuthError semantics.
class AuthErrorLike extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
