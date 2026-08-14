import type { NextRequest } from "next/server"
import { json, errorResponse, handleErrors, assertDbConfigured } from "@/lib/api"
import { query, withTransaction } from "@/lib/db"
import { requireUser, requireRole } from "@/lib/auth"
import type { MaintenanceStatus } from "@/lib/types"

const STATUSES: MaintenanceStatus[] = ["open", "in_progress", "completed", "cancelled"]

export async function GET() {
  try {
    assertDbConfigured()
    await requireUser()
    const logs = await query(
      `SELECT m.*, a.name AS asset_name, a.tag_id AS asset_tag
         FROM maintenance_logs m JOIN assets a ON a.id = m.asset_id
        ORDER BY m.created_at DESC`,
    )
    return json({ logs })
  } catch (err) {
    return handleErrors(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    assertDbConfigured()
    const actor = await requireRole("admin", "staff")
    const b = await req.json()
    const assetId = Number(b.asset_id)
    const issue = String(b.issue_detail || "").trim()
    if (!Number.isInteger(assetId) || !issue) {
      return errorResponse("asset_id and issue_detail are required.", 400)
    }
    const status: MaintenanceStatus = STATUSES.includes(b.status) ? b.status : "open"

    // When a repair is opened/in-progress, mark the asset under_repair (transactionally).
    const result = await withTransaction(async (conn) => {
      const [assetRows] = await conn.query<any[]>("SELECT id FROM assets WHERE id = ? FOR UPDATE", [assetId])
      if (assetRows.length === 0) return { error: "Asset not found.", status: 404 }

      const [ins]: any = await conn.query(
        `INSERT INTO maintenance_logs
          (asset_id, issue_detail, repair_cost, vendor, repair_date, status, reported_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          assetId,
          issue,
          b.repair_cost != null && b.repair_cost !== "" ? Number(b.repair_cost) : null,
          b.vendor || null,
          b.repair_date || null,
          status,
          actor.id,
        ],
      )
      if (status === "open" || status === "in_progress") {
        await conn.query("UPDATE assets SET status = 'under_repair' WHERE id = ?", [assetId])
      }
      return { ok: true, id: ins.insertId }
    })

    if ("error" in result) return errorResponse(result.error!, result.status)
    return json(result, 201)
  } catch (err) {
    return handleErrors(err)
  }
}
