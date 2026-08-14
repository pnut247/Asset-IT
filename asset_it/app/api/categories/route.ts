import { json, handleErrors, assertDbConfigured } from "@/lib/api"
import { query } from "@/lib/db"
import { requireUser } from "@/lib/auth"

export async function GET() {
  try {
    assertDbConfigured()
    await requireUser()
    const rows = await query<{ category: string }>(
      "SELECT DISTINCT category FROM assets WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC",
    )
    return json({ categories: rows.map((r) => r.category) })
  } catch (err) {
    return handleErrors(err)
  }
}
