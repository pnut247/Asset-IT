import type { NextRequest } from "next/server"
import { json, errorResponse, handleErrors, assertDbConfigured } from "@/lib/api"
import { query } from "@/lib/db"
import { requireUser, requireRole, hashPassword } from "@/lib/auth"
import type { Role } from "@/lib/types"

const ROLES: Role[] = ["admin", "staff", "user"]

// List users (any authenticated user can see the directory for assignment purposes).
export async function GET() {
  try {
    assertDbConfigured()
    await requireUser()
    const users = await query(
      "SELECT id, name, email, role, department, is_active, created_at FROM users ORDER BY name ASC",
    )
    return json({ users })
  } catch (err) {
    return handleErrors(err)
  }
}

// Create a user (admin only).
export async function POST(req: NextRequest) {
  try {
    assertDbConfigured()
    await requireRole("admin")
    const body = await req.json()
    const name = String(body.name || "").trim()
    const email = String(body.email || "").toLowerCase().trim()
    const password = String(body.password || "")
    const role: Role = ROLES.includes(body.role) ? body.role : "user"
    const department = body.department ? String(body.department).trim() : null

    if (!name || !email || !password) {
      return errorResponse("Name, email and password are required.", 400)
    }
    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters.", 400)
    }

    const hash = await hashPassword(password)
    const result: any = await query(
      "INSERT INTO users (name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?)",
      [name, email, hash, role, department],
    )
    return json({ ok: true, id: (result as any).insertId }, 201)
  } catch (err) {
    return handleErrors(err)
  }
}
