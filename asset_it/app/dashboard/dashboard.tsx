import { query } from "@/lib/db"

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
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IT Asset Management Dashboard</h1>
          <p className="text-slate-400 text-sm">ภาพรวมระบบจัดการครุภัณฑ์และไอทีไอทีภายในองค์กร</p>
        </div>
        <a
          href="/login"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-md transition"
        >
          Logout
        </a>
      </div>

      {/* Cards Stat */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <p className="text-xs text-slate-400 font-medium">อุปกรณ์ทั้งหมด (Assets)</p>
          <p className="text-3xl font-bold mt-2 text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <p className="text-xs text-slate-400 font-medium">กำลังถูกใช้งาน (In Use)</p>
          <p className="text-3xl font-bold mt-2 text-emerald-400">{stats.inUse}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <p className="text-xs text-slate-400 font-medium">ส่งซ่อมบำรุง (Under Repair)</p>
          <p className="text-3xl font-bold mt-2 text-amber-400">{stats.repair}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <p className="text-xs text-slate-400 font-medium">ผู้ใช้งานทั้งหมด (Users)</p>
          <p className="text-3xl font-bold mt-2 text-blue-400">{stats.users}</p>
        </div>
      </div>

      {/* Quick Menu */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-white">เมนูด่วน (Quick Navigation)</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/assets" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition">
            จัดการอุปกรณ์ (Assets)
          </a>
          <a href="/assignments" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition">
            ประวัติการยืม-คืน (Assignments)
          </a>
          <a href="/maintenance" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition">
            แจ้งซ่อมบำรุง (Maintenance)
          </a>
          <a href="/licenses" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition">
            ไลเซนส์ซอฟต์แวร์ (Licenses)
          </a>
        </div>
      </div>
    </div>
  )
}