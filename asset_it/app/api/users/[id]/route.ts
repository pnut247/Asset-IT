import type { NextRequest } from "next/server"
import { json, errorResponse, handleErrors, assertDbConfigured } from "@/lib/api"
import { query } from "@/lib/db"
import { requireRole, hashPassword } from "@/lib/auth"

// อัปเดตข้อมูลผู้ใช้ (PUT) - แอดมินเท่านั้น
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertDbConfigured()
    await requireRole("admin")
    
    const { id } = await params
    const body = await req.json()
    const name = String(body.name || "").trim()
    const username = String(body.username || "").trim()
    const department = body.department ? String(body.department).trim() : null
    const role = String(body.role || "admin").trim()
    const password = String(body.password || "")

    if (!name || !username) {
      return errorResponse("กรุณากรอกชื่อ (Name) และชื่อผู้ใช้ (Username) ให้ครบถ้วน", 400)
    }

    if (password) {
      if (password.length < 6) {
        return errorResponse("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", 400)
      }
      const hash = await hashPassword(password)
      await query(
        "UPDATE users SET name = ?, email = ?, password_hash = ?, department = ?, role = ? WHERE id = ?",
        [name, username, hash, department, role, id]
      )
    } else {
      await query(
        "UPDATE users SET name = ?, email = ?, department = ?, role = ? WHERE id = ?",
        [name, username, department, role, id]
      )
    }

    return json({ ok: true, message: "User updated successfully" })
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return errorResponse("ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว", 409)
    }
    return handleErrors(err)
  }
}

// ลบผู้ใช้ (DELETE) - แอดมินเท่านั้น
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertDbConfigured()
    await requireRole("admin")
    
    const { id } = await params

    // อัปเดตให้ is_active เป็น 0 (หรือปิดการใช้งาน) แทนการลบแถวออกจากตาราง
    await query("UPDATE users SET is_active = 0 WHERE id = ?", [id])

    return json({ ok: true, message: "User deactivated successfully" })
  } catch (err) {
    return handleErrors(err)
  }
}