import type { NextRequest } from "next/server"
import { json, errorResponse, handleErrors, assertDbConfigured } from "@/lib/api"
import { withTransaction } from "@/lib/db"
import { requireRole } from "@/lib/auth"

/**
 * POST /api/assets/checkout
 * Body: { asset_id, user_id, due_date? }
 *
 * - Verifies the asset exists and is 'in_stock' (else 409).
 * - Flips asset status to 'in_use' and sets assigned_to.
 * - Inserts an assignments row.
 * All inside a transaction with a row lock (FOR UPDATE) to prevent double checkout.
 */
export async function POST(req: NextRequest) {
  try {
    assertDbConfigured()
    const actor = await requireRole("admin", "staff")
    const body = await req.json()

    const assetId = Number(body.asset_id)
    const userId = Number(body.user_id)
    const dueDate: string | null = body.due_date || null

    if (!Number.isInteger(assetId) || !Number.isInteger(userId)) {
      return errorResponse("asset_id and user_id are required and must be valid IDs.", 400)
    }

    const result = await withTransaction(async (conn) => {
      // Lock the asset row for the duration of the transaction.
      const [assetRows] = await conn.query<any[]>(
        "SELECT id, status FROM assets WHERE id = ? FOR UPDATE",
        [assetId],
      )
      if (assetRows.length === 0) {
        return { error: "Asset not found.", status: 404 }
      }
      const asset = assetRows[0]
      if (asset.status !== "in_stock") {
        return {
          error: `Asset is not available for checkout (current status: ${asset.status}).`,
          status: 409,
        }
      }

      // Verify the target user exists.
      const [userRows] = await conn.query<any[]>(
        "SELECT id FROM users WHERE id = ? AND is_active = 1",
        [userId],
      )
      if (userRows.length === 0) {
        return { error: "Target user not found.", status: 404 }
      }

      await conn.query(
        "UPDATE assets SET status = 'in_use', assigned_to = ? WHERE id = ?",
        [userId, assetId],
      )
      const [ins]: any = await conn.query(
        `INSERT INTO assignments (asset_id, user_id, expected_return, status, checkout_by)
         VALUES (?, ?, ?, 'checked_out', ?)`,
        [assetId, userId, dueDate, actor.id],
      )
      return { ok: true, assignmentId: ins.insertId }
    })

    if ("error" in result) {
      return errorResponse(result.error!, result.status)
    }
    return json(result, 201)
  } catch (err) {
    return handleErrors(err)
  }
}
