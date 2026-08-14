import { json, handleErrors, assertDbConfigured } from "@/lib/api"
import { query } from "@/lib/db"
import { requireUser } from "@/lib/auth"

export async function GET() {
  try {
    assertDbConfigured()
    await requireUser()

    const [assetCounts] = await query<any>(
      `SELECT
        COUNT(*) AS totalAssets,
        SUM(status = 'in_use') AS inUse,
        SUM(status = 'in_stock') AS inStock,
        SUM(status = 'under_repair') AS underRepair,
        SUM(status = 'retired') AS retired
       FROM assets`,
    )
    const [userCount] = await query<any>("SELECT COUNT(*) AS totalUsers FROM users")
    const [licCount] = await query<any>(
      `SELECT COUNT(*) AS totalLicenses,
              SUM(expiration_date IS NOT NULL AND expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS expiringLicenses
         FROM software_licenses`,
    )
    const [maintCount] = await query<any>(
      "SELECT SUM(status IN ('open','in_progress')) AS openMaintenance FROM maintenance_logs",
    )
    const [overdue] = await query<any>(
      `SELECT COUNT(*) AS overdueAssignments FROM assignments
        WHERE status IN ('checked_out','overdue')
          AND expected_return IS NOT NULL AND expected_return < CURDATE()`,
    )

    // Recent activity (latest assignments)
    const recent = await query(
      `SELECT asg.id, asg.status, asg.checkout_date, asg.actual_return_date,
              a.name AS asset_name, a.tag_id AS asset_tag, u.name AS user_name
         FROM assignments asg
         JOIN assets a ON a.id = asg.asset_id
         JOIN users u ON u.id = asg.user_id
        ORDER BY asg.checkout_date DESC LIMIT 8`,
    )

    // Category breakdown for chart
    const byCategory = await query(
      `SELECT COALESCE(category, 'Uncategorized') AS category, COUNT(*) AS count
         FROM assets GROUP BY category ORDER BY count DESC`,
    )

    const summary = {
      totalAssets: Number(assetCounts.totalAssets) || 0,
      inUse: Number(assetCounts.inUse) || 0,
      inStock: Number(assetCounts.inStock) || 0,
      underRepair: Number(assetCounts.underRepair) || 0,
      retired: Number(assetCounts.retired) || 0,
      totalUsers: Number(userCount.totalUsers) || 0,
      totalLicenses: Number(licCount.totalLicenses) || 0,
      expiringLicenses: Number(licCount.expiringLicenses) || 0,
      openMaintenance: Number(maintCount.openMaintenance) || 0,
      overdueAssignments: Number(overdue.overdueAssignments) || 0,
    }

    return json({ summary, recent, byCategory })
  } catch (err) {
    return handleErrors(err)
  }
}
