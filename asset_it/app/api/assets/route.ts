import type { NextRequest } from "next"
import { json, errorResponse, handleErrors, assertDbConfigured } from "@/lib/api"
import { query } from "@/lib/db"
import { requireUser, requireRole } from "@/lib/auth"
import type { AssetStatus } from "@/lib/types"

const STATUSES: AssetStatus[] = ["in_stock", "in_use", "under_repair", "retired"]

// GET /api/assets
export async function GET(req: NextRequest) {
  try {
    assertDbConfigured()
    await requireUser()

    const sp = req.nextUrl.searchParams
    const search = sp.get("search")?.trim() || ""
    const status = sp.get("status") || ""
    const category = sp.get("category") || ""
    const page = Math.max(1, Number(sp.get("page")) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 10))
    const offset = (page - 1) * pageSize

    const where: string[] = []
    const params: any[] = []

    if (search) {
      where.push("(a.name LIKE ? OR a.serial_number LIKE ? OR a.tag_id LIKE ? OR a.brand LIKE ? OR a.model LIKE ?)")
      const like = `%${search}%`
      params.push(like, like, like, like, like)
    }
    if (status && STATUSES.includes(status as AssetStatus)) {
      where.push("a.status = ?")
      params.push(status)
    }
    if (category) {
      where.push("a.category = ?")
      params.push(category)
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM assets a ${whereSql}`,
      params,
    )
    const total = countRows[0]?.total ?? 0

    // 🟢 แก้ไข: ใช้เฉพาะคอลัมน์ที่มีอยู่จริงใน DB (u.name, a.assigned_to_name, a.department)
    const rows = await query(
      `SELECT a.*, 
              COALESCE(u.name, a.assigned_to_name) AS assigned_to_name,
              COALESCE(u.department, a.department) AS assigned_to_dept
         FROM assets a
         LEFT JOIN users u ON u.id = a.assigned_to
         ${whereSql}
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    )

    return json({ assets: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    return handleErrors(err)
  }
}

// POST /api/assets
export async function POST(req: NextRequest) {
  try {
    assertDbConfigured()
    await requireRole("admin", "staff")
    const b = await req.json()

    const tag_id = String(b.tag_id || "").trim()
    const name = String(b.name || "").trim()
    if (!tag_id || !name) {
      return errorResponse("Asset Tag ID and name are required.", 400)
    }

    // 1. เช็ก Tag ID ซ้ำ
    const existing = await query<{ id: number }[]>("SELECT id FROM assets WHERE tag_id = ? LIMIT 1", [tag_id])
    if (existing.length > 0) {
      return errorResponse(`Asset Tag ID '${tag_id}' already exists in the system.`, 400)
    }

    // 2. ดึงค่าชื่อผู้ถือครองและแผนกจากที่พิมพ์เข้ามาตรงๆ
    const assigned_user_name = String(b.assigned_user_name || "").trim() || null
    const department = String(b.department || "").trim() || null

    // ค้นหา user_id ในตาราง users (ถ้ามีก็นำ ID มาผูกไว้)
    let assigned_to: number | null = null
    if (assigned_user_name) {
      const userRows = await query<{ id: number }[]>(
        "SELECT id FROM users WHERE LOWER(name) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1",
        [assigned_user_name, assigned_user_name]
      )
      if (userRows.length > 0) {
        assigned_to = userRows[0].id
      }
    }

    // กำหนดสถานะอัตโนมัติ (ถ้าใส่ชื่อถือครองเข้ามา ให้เป็น in_use)
    let status: AssetStatus = STATUSES.includes(b.status) ? b.status : "in_stock"
    if (assigned_user_name && status === "in_stock") {
      status = "in_use"
    }

    const purchase_date = b.purchase_date && String(b.purchase_date).trim() !== "" ? b.purchase_date : null
    const warranty_expire = b.warranty_expire && String(b.warranty_expire).trim() !== "" ? b.warranty_expire : null
    const price = b.price !== null && b.price !== "" && !isNaN(Number(b.price)) ? Number(b.price) : null

    // 3. บันทึกลงตาราง assets
    const result: any = await query(
      `INSERT INTO assets
        (tag_id, name, category, serial_number, brand, model, spec, status, location, purchase_date, warranty_expire, price, invoice_po, assigned_to, assigned_to_name, department)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tag_id,
        name,
        b.category || null,
        b.serial_number || null,
        b.brand || null,
        b.model || null,
        b.spec || null,
        status,
        b.location || null,
        purchase_date,
        warranty_expire,
        price,
        b.invoice_po || null,
        assigned_to,
        assigned_user_name,
        department,
      ],
    )

    return json({ ok: true, id: result.insertId }, 201)
  } catch (err: any) {
    console.error("❌ Error in POST /api/assets:", err)
    return handleErrors(err)
  }
}