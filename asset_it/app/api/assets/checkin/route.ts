import type { NextRequest } from "next/server"
import { json, errorResponse, handleErrors, assertDbConfigured } from "@/lib/api"
import { withTransaction } from "@/lib/db"
import { requireRole } from "@/lib/auth"

/**
 * POST /api/assets/checkin
 * Body: { asset_id }
 *
 * - Verifies the asset exists and is currently 'in_use'.
 * - Closes the open assignment (sets actual_return_date + status 'returned').
 * - Flips asset status back to 'in_stock' and clears assigned_to.
 * All inside a transaction with a row lock.
 */
export async function POST(req: NextRequest) {
  try {
    assertDbConfigured()
    await requireRole("admin", "staff")
    const body = await req.json()
    const assetId = Number(body.asset_id)

    if (!Number.isInteger(assetId)) {
      return errorResponse("asset_id is required and must be a valid ID.", 400)
    }

    const result = await withTransaction(async (conn) => {
      const [assetRows] = await conn.query<any[]>(
        "SELECT id, status FROM assets WHERE id = ? FOR UPDATE",
        [assetId],
      )
      if (assetRows.length === 0) {
        return { error: "Asset not found.", status: 404 }
      }
      if (assetRows[0].status !== "in_use") {
        return {
          error: `Asset is not currently checked out (status: ${assetRows[0].status}).`,
          status: 409,
        }
      }

      // Close the most recent open assignment for this asset.
      await conn.query(
        `UPDATE assignments
            SET status = 'returned', actual_return_date = NOW()
          WHERE asset_id = ? AND status IN ('checked_out','overdue')
          ORDER BY checkout_date DESC
          LIMIT 1`,
        [assetId],
      )
      await conn.query(
        "UPDATE assets SET status = 'in_stock', assigned_to = NULL WHERE id = ?",
        [assetId],
      )
      return { ok: true }
    })

    if ("error" in result) {
      return errorResponse(result.error!, result.status)
    }
    return json(result)
  } catch (err) {
    return handleErrors(err)
  }
}
