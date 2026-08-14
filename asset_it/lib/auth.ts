import "server-only"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { query } from "./db"

export type Role = "admin" | "staff" | "user"

export type SessionUser = {
  id: number
  name: string
  email: string
  role: Role
  department: string | null
}

const SESSION_COOKIE = "itam_session"
const SESSION_TTL_DAYS = 7

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/** Create a session row and set the httpOnly cookie. */
export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  await query(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
    [token, userId, expires],
  )
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  })
}

export async function destroySession(): Promise<void> {
  try {
    const store = await cookies()
    // 🟢 แก้ไขตรงนี้จาก storet เป็น store.get
    const token = store.get(SESSION_COOKIE)?.value 
    
    if (token) {
      await query("DELETE FROM sessions WHERE token = ?", [token]).catch(() => {})
      store.delete(SESSION_COOKIE)
    } else {
      store.delete(SESSION_COOKIE)
    }
  } catch (err) {
    console.error("destroySession error:", err)
  }
}

/** Resolve the current user from the session cookie, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const rows = await query<any>(
    `SELECT u.id, u.name, u.email, u.role, u.department
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > NOW() AND u.is_active = 1
      LIMIT 1`,
    [token],
  )
  if (rows.length === 0) return null
  return rows[0] as SessionUser
}

/** Throws if not authenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new AuthError("Unauthorized", 401)
  return user
}

/** Throws if the user lacks one of the allowed roles. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) throw new AuthError("Forbidden", 403)
  return user
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}