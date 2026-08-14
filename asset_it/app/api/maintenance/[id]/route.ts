import type { NextRequest } from "next/server"
import { json, errorResponse, handleErrors, assertDbConfigured } from "@/lib/api"
import { withTransaction } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import type { MaintenanceStatus } from "@/lib/types"

const STATUSES: MaintenanceStatus[] = ["open", "in_progress", "completed", "cancelled"]

// PATCH /api/maintenance/:id  { status, repair_cost?, vendor?, repair_date? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertDbConfigured()
    await requireRole("admin", "staff")
    const { id } = await params
    const logId = Number(id)
    const b = await req.json()
    if (!STATUSES.includes(b.status)) return errorResponse("Invalid status.", 400)

    const result = await withTransaction(async (conn) => {
      const [rows] = await conn.query<any[]>("SELECT asset_id FROM maintenance_logs WHERE id = ?", [logId])
      if (rows.length === 0) return { error: "Maintenance log not found.", status: 404 }
      const assetId = rows[0].asset_id

      await conn.query(
        `UPDATE maintenance_logs
            SET status = ?,
                repair_cost = COALESCE(?, repair_cost),
                vendor = COALESCE(?, vendor),
                repair_date = COALESCE(?, repair_date)
          WHERE id = ?`,
        [
          b.status,
          b.repair_cost != null && b.repair_cost !== "" ? Number(b.repair_cost) : null,
          b.vendor || null,
          b.repair_date || null,
          logId,
        ],
      )

      // When repair completes/cancels, return asset to stock only if it's still under_repair.
      if (b.status === "completed" || b.status === "cancelled") {
        await conn.query(
          "UPDATE assets SET status = 'in_stock' WHERE id = ? AND status = 'under_repair'",
          [assetId],
        )
      }
      return { ok: true }
    })

    if ("error" in result) return errorResponse(result.error!, result.status)
    return json(result)
  } catch (err) {
    return handleErrors(err)
  }
}
