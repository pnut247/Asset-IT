import { query } from "@/lib/db"
import Link from "next/link"

async function getStats() {
  try {
    const totalAssets: any = await query("SELECT COUNT(*) as count FROM assets")
    const inUseAssets: any = await query("SELECT COUNT(*) as count FROM assets WHERE status = 'in_use'")
    const underRepair: any = await query("SELECT COUNT(*) as count FROM assets WHERE status = 'under_repair'")
    const totalUsers: any = await query("SELECT COUNT(*) as count FROM users")

    return {
      total: totalAssets[0]?.count || 0,
      inUse: inUseAssets[0]?.count || 0,
      repair: underRepair[0]?.count || 0,
      users: totalUsers[0]?.count || 0,
    }
  } catch (error) {
    return { total: 0, inUse: 0, repair: 0, users: 0 }
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IT Asset Management Dashboard</h1>
          <p className="text-muted-foreground text-sm">ภาพรวมระบบจัดการครุภัณฑ์และไอทีภายในองค์กร</p>
        </div>
      </div>

      {/* Cards Stat */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">อุปกรณ์ทั้งหมด (Assets)</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">กำลังถูกใช้งาน (In Use)</p>
          <p className="text-3xl font-bold mt-2 text-emerald-500">{stats.inUse}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">ส่งซ่อมบำรุง (Under Repair)</p>
          <p className="text-3xl font-bold mt-2 text-amber-500">{stats.repair}</p>
        </div>
        
        {/* การ์ดผู้ใช้งานทั้งหมดแบบมีลิงก์กดไปหน้า /users */}
        <Link href="/users" className="block transition hover:opacity-80">
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm h-full">
            <p className="text-xs text-muted-foreground font-medium">ผู้ใช้งานทั้งหมด (Users)</p>
            <p className="text-3xl font-bold mt-2 text-blue-500">{stats.users}</p>
          </div>
        </Link>
      </div>

      {/* Quick Menu */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">เมนูด่วน (Quick Navigation)</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/assets" className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition">
            จัดการอุปกรณ์ (Assets)
          </Link>
          <Link href="/maintenance" className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition">
            แจ้งซ่อมบำรุง (Maintenance)
          </Link>
          <Link href="/licenses" className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition">
            ไลเซนส์ซอฟต์แวร์ (Licenses)
          </Link>
          <Link href="/scan" className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition">
            สแกน QR Code (Scan QR)
          </Link>
        </div>
      </div>
    </div>
  )
}