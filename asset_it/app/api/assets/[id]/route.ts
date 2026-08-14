import type { NextRequest } from "next/server"
import { json, errorResponse, handleErrors, assertDbConfigured } from "@/lib/api"
import { query } from "@/lib/db"
import { requireUser, requireRole } from "@/lib/auth"
import type { AssetStatus } from "@/lib/types"

const STATUSES: AssetStatus[] = ["in_stock", "in_use", "under_repair", "retired"]

async function findAsset(idOrTag: string) {
  // Accept numeric id or tag_id string.
  const isNumeric = /^\d+$/.test(idOrTag)
  const rows = await query<any>(
    `SELECT a.*, u.name AS assigned_to_name
       FROM assets a LEFT JOIN users u ON u.id = a.assigned_to
      WHERE ${isNumeric ? "a.id = ?" : "a.tag_id = ?"} LIMIT 1`,
    [idOrTag],
  )
  return rows[0] || null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertDbConfigured()
    await requireUser()
    const { id } = await params
    const asset = await findAsset(id)
    if (!asset) return errorResponse("Asset not found.", 404)

    const assignments = await query(
      `SELECT asg.*, u.name AS user_name
         FROM assignments asg JOIN users u ON u.id = asg.user_id
        WHERE asg.asset_id = ? ORDER BY asg.checkout_date DESC`,
      [asset.id],
    )
    const maintenance = await query(
      "SELECT * FROM maintenance_logs WHERE asset_id = ? ORDER BY created_at DESC",
      [asset.id],
    )

    return json({ asset, assignments, maintenance })
  } catch (err) {
    return handleErrors(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertDbConfigured()
    await requireRole("admin", "staff")
    const { id } = await params
    const asset = await findAsset(id)
    if (!asset) return errorResponse("Asset not found.", 404)

    const b = await req.json()
    const fields: string[] = []
    const values: any[] = []
    const allowed = [
      "tag_id", "name", "category", "serial_number", "brand", "model",
      "spec", "status", "location", "purchase_date", "warranty_expire", "price", "invoice_po",
    ]
    for (const key of allowed) {
      if (key in b) {
        if (key === "status" && !STATUSES.includes(b.status)) continue
        fields.push(`${key} = ?`)
        values.push(b[key] === "" ? null : b[key])
      }
    }
    if (fields.length === 0) return errorResponse("No valid fields to update.", 400)

    values.push(asset.id)
    await query(`UPDATE assets SET ${fields.join(", ")} WHERE id = ?`, values)
    return json({ ok: true })
  } catch (err) {
    return handleErrors(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertDbConfigured()
    await requireRole("admin")
    const { id } = await params
    const asset = await findAsset(id)
    if (!asset) return errorResponse("Asset not found.", 404)
    await query("DELETE FROM assets WHERE id = ?", [asset.id])
    return json({ ok: true })
  } catch (err) {
    return handleErrors(err)
  }
}
