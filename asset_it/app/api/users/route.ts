import type { NextRequest } from "next/server"
import { json, errorResponse, handleErrors, assertDbConfigured } from "@/lib/api"
import { query } from "@/lib/db"
import { requireUser, requireRole, hashPassword } from "@/lib/auth"

// List users (any authenticated user can see the directory for assignment purposes).
export async function GET() {
  try {
    assertDbConfigured()
    await requireUser()
    const users = await query(
      "SELECT id, name, email as username, role, department, is_active, created_at FROM users ORDER BY name ASC",
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
    const username = String(body.username || body.email || "").trim()
    const password = String(body.password || "")
    // 🟢 บังคับให้ Role เป็น "admin" เสมอเมื่อสร้างใหม่
    const role = "admin"
    const department = body.department ? String(body.department).trim() : null

    if (!name || !username || !password) {
      return errorResponse("กรุณากรอกชื่อ (Name), ชื่อผู้ใช้ (Username) และรหัสผ่าน (Password) ให้ครบถ้วน", 400)
    }
    if (password.length < 6) {
      return errorResponse("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", 400)
    }

    const hash = await hashPassword(password)
    const result: any = await query(
      "INSERT INTO users (name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?)",
      [name, username, hash, role, department],
    )
    return json({ ok: true, id: (result as any).insertId }, 201)
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return errorResponse("ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว", 409)
    }
    return handleErrors(err)
  }
}