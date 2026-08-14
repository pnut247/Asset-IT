import type { NextRequest } from "next/server"
import { json, errorResponse, handleErrors, assertDbConfigured } from "@/lib/api"
import { query } from "@/lib/db"
import { requireUser, requireRole } from "@/lib/auth"

// 🟢 GET: ดึงข้อมูล License พร้อมนับจำนวนเครื่องและดึง List รายชื่อเครื่องผูกใช้งาน
export async function GET() {
  try {
    assertDbConfigured()
    await requireUser()

    const rows = await query<any[]>(
      `SELECT 
          l.id,
          l.software_name,
          l.license_key,
          CAST(l.total_seats AS SIGNED) AS total_seats,
          CAST(
            GREATEST(
              COUNT(DISTINCT la.id),
              l.assigned_seats
            ) AS SIGNED
          ) AS assigned_seats,
          l.expiration_date,
          GROUP_CONCAT(DISTINCT TRIM(la.asset_name) ORDER BY la.asset_name ASC SEPARATOR ', ') AS assigned_assets
       FROM software_licenses l
       LEFT JOIN license_assignments la ON la.license_id = l.id
       GROUP BY l.id
       ORDER BY l.software_name ASC`
    )

    return json({ data: rows, licenses: rows })
  } catch (err) {
    console.error("❌ GET /api/licenses Error:", err)
    return handleErrors(err)
  }
}

// 🟢 POST: รองรับสร้าง License ใหม่, เพิ่มเครื่อง (Assign) และลบเครื่อง (Unassign)
export async function POST(req: NextRequest) {
  try {
    assertDbConfigured()
    const user = await requireUser()
    await requireRole("admin", "staff")
    const b = await req.json()

    // 🔴 กรณีที่ 1: ลบเครื่องผูกใช้งานออกจาก License (Unassign Asset)
    if (b.action === "unassign_asset") {
      const { license_id, asset_name } = b
      if (!license_id || !asset_name) {
        return errorResponse("License ID and Asset name are required.", 400)
      }

      await query(
        `DELETE FROM license_assignments WHERE license_id = ? AND asset_name = ?`,
        [license_id, String(asset_name).trim()]
      )

      return json({ ok: true, message: "Asset unassigned successfully" })
    }

    // 🟢 กรณีที่ 2: ผูกชื่อเครื่องเข้ากับ License (Assign Device)
    if (b.action === "assign_asset") {
      const { license_id, asset_name } = b
      if (!license_id || !asset_name) {
        return errorResponse("License ID and Asset name are required.", 400)
      }

      // 1. ดึงข้อมูล License เพื่อเช็กจำกัด Seats
      const licenses = await query<any[]>(
        `SELECT total_seats FROM software_licenses WHERE id = ?`,
        [license_id]
      )
      if (!licenses || licenses.length === 0) {
        return errorResponse("Software License not found.", 404)
      }
      const totalSeats = Number(licenses[0].total_seats) || 0

      // 2. ดึงจำนวนเครื่องที่ผูกใช้อยู่ในปัจจุบัน
      const currentAssigned = await query<any[]>(
        `SELECT COUNT(DISTINCT id) AS count FROM license_assignments WHERE license_id = ?`,
        [license_id]
      )
      const currentCount = Number(currentAssigned[0]?.count) || 0

      // 3. แยกรายชื่อเครื่องใหม่ที่ต้องการเพิ่ม (ตัดรายการซ้ำและช่องว่าง)
      const assetList = Array.from(
        new Set(
          String(asset_name)
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
        )
      )

      if (assetList.length === 0) {
        return errorResponse("Valid asset name is required.", 400)
      }

      // 4. เช็กว่าเครื่องที่จะเพิ่ม มีกี่เครื่องที่ไม่เคยถูกเพิ่มมาก่อนใน License นี้
      const existingAssets = await query<any[]>(
        `SELECT asset_name FROM license_assignments WHERE license_id = ? AND asset_name IN (?)`,
        [license_id, assetList]
      )
      const existingSet = new Set(existingAssets.map((e) => e.asset_name))
      const newAssetsCount = assetList.filter((a) => !existingSet.has(a)).length

      // 🚫 ตรวจสอบขีดจำกัดความจุ (100% Seat Limit)
      if (currentCount + newAssetsCount > totalSeats) {
        return errorResponse(
          `ไม่สามารถเพิ่มได้ เนื่องจากจำนวนเครื่องเกินขีดจำกัดความจุ 100% (จำกัดสูงสุด ${totalSeats} Seats, ปัจจุบันมี ${currentCount} เครื่อง)`,
          400
        )
      }

      // 5. ทำการบันทึกเครื่องใหม่ลง Database
      for (const name of assetList) {
        await query(
          `INSERT IGNORE INTO license_assignments (license_id, user_id, asset_name, assigned_at) 
           VALUES (?, ?, ?, NOW())`,
          [license_id, user.id, name]
        )
      }

      return json({ ok: true, message: "Asset assigned successfully" }, 201)
    }

    // 🔵 กรณีที่ 3: สร้าง License ใหม่
    const software_name = String(b.software_name || "").trim()
    if (!software_name) return errorResponse("Software name is required.", 400)

    const total_seats = Math.max(1, Number(b.total_seats) || 1)
    const expiration_date = b.expiration_date && String(b.expiration_date).trim() !== "" ? b.expiration_date : null

    try {
      const result: any = await query(
        `INSERT INTO software_licenses
          (software_name, license_key, total_seats, assigned_seats, expiration_date)
         VALUES (?, ?, ?, 0, ?)`,
        [software_name, b.license_key || null, total_seats, expiration_date]
      )

      return json({ ok: true, id: result.insertId }, 201)
    } catch (dbErr: any) {
      if (dbErr?.code === "ER_DUP_ENTRY") {
        return errorResponse("License Key หรือ Software Name นี้มีอยู่ในระบบแล้ว", 400)
      }
      throw dbErr
    }
  } catch (err) {
    return handleErrors(err)
  }
}

// 🔴 DELETE: ลบ License และรายการผูกเครื่องทั้งหมดที่เกี่ยวข้อง
export async function DELETE(req: NextRequest) {
  try {
    assertDbConfigured()
    await requireRole("admin", "staff")
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return errorResponse("License ID is required", 400)

    await query(`DELETE FROM license_assignments WHERE license_id = ?`, [id])
    await query(`DELETE FROM software_licenses WHERE id = ?`, [id])

    return json({ ok: true, message: "License deleted successfully" })
  } catch (err) {
    return handleErrors(err)
  }
}