import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { RoleBadge } from "@/components/status-badge"
import { SwitchAccountButton } from "@/components/switch-account-button"
import Image from "next/image"

async function getDashboardData() {
  try {
    const totalAssets: any = await query("SELECT COUNT(*) as count FROM assets")
    const inUseAssets: any = await query("SELECT COUNT(*) as count FROM assets WHERE status = 'in_use'")
    const underRepair: any = await query("SELECT COUNT(*) as count FROM assets WHERE status = 'under_repair'")
    const totalUsers: any = await query("SELECT COUNT(*) as count FROM users")
    const recentAssets: any = await query("SELECT * FROM assets ORDER BY created_at DESC LIMIT 5")

    return {
      stats: {
        total: totalAssets[0]?.count || 0,
        inUse: inUseAssets[0]?.count || 0,
        repair: underRepair[0]?.count || 0,
        users: totalUsers[0]?.count || 0,
      },
      recentAssets: recentAssets || [],
    }
  } catch (error) {
    return {
      stats: { total: 0, inUse: 0, repair: 0, users: 0 },
      recentAssets: [],
    }
  }
}

export default async function Page() {
  const { stats, recentAssets } = await getDashboardData()
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
            <Image
              src="/big_star_co__ltd__gambol_thailand__logo.png"
              alt="BIGSTAR Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">IT BIGSTAR AssetHub</h1>
            <p className="text-xs text-slate-400">ระบบจัดการครุภัณฑ์และอุปกรณ์ไอที</p>
          </div>
        </div>

        {/* ผู้ใช้งานปัจจุบัน / ปุ่มจัดการบัญชี */}
        <div className="flex items-center gap-4">
          <a
            href="/setup"
            className="text-xs text-slate-400 hover:text-white transition hidden sm:inline"
          >
            Setup DB
          </a>

          {user && (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold shrink-0">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-medium text-slate-200 leading-none">{user.name}</p>
                <div className="mt-1">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>
          )}

          <SwitchAccountButton />
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">อุปกรณ์ทั้งหมด</span>
            <div className="text-3xl font-extrabold text-white mt-2">{stats.total} <span className="text-sm font-normal text-slate-500">รายการ</span></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">กำลังใช้งาน</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">{stats.inUse} <span className="text-sm font-normal text-slate-500">รายการ</span></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">ส่งซ่อมบำรุง</span>
            <div className="text-3xl font-extrabold text-amber-400 mt-2">{stats.repair} <span className="text-sm font-normal text-slate-500">รายการ</span></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">ผู้ใช้งานในระบบ</span>
            <div className="text-3xl font-extrabold text-blue-400 mt-2">{stats.users} <span className="text-sm font-normal text-slate-500">คน</span></div>
          </div>
        </div>

        {/* Navigation Shortcut */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold mb-4 text-white">การจัดการระบบ (Quick Access)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a href="/assets" className="p-4 bg-slate-800/60 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 rounded-lg text-slate-200 transition text-center font-medium text-sm block">
              💻 จัดการอุปกรณ์ (Assets)
            </a>
            <a href="/assignments" className="p-4 bg-slate-800/60 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 rounded-lg text-slate-200 transition text-center font-medium text-sm block">
              🔄 ประวัติยืม-คืน (Borrow/Return)
            </a>
            <a href="/maintenance" className="p-4 bg-slate-800/60 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 rounded-lg text-slate-200 transition text-center font-medium text-sm block">
              🛠️ แจ้งซ่อมบำรุง (Maintenance)
            </a>
            <a href="/licenses" className="p-4 bg-slate-800/60 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 rounded-lg text-slate-200 transition text-center font-medium text-sm block">
              🔑 ไลเซนส์ซอฟต์แวร์ (Licenses)
            </a>
          </div>
        </div>

        {/* Recent Assets Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-base font-semibold text-white">อุปกรณ์ล่าสุดในระบบ</h2>
            <a href="/assets" className="text-xs text-blue-400 hover:underline">ดูทั้งหมด →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/50 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Tag ID</th>
                  <th className="p-4">ชื่ออุปกรณ์</th>
                  <th className="p-4">หมวดหมู่</th>
                  <th className="p-4">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentAssets.length > 0 ? (
                  recentAssets.map((asset: any) => (
                    <tr key={asset.id} className="hover:bg-slate-800/40">
                      <td className="p-4 font-mono text-blue-400">{asset.tag_id}</td>
                      <td className="p-4 font-medium text-white">{asset.name}</td>
                      <td className="p-4">{asset.category || "-"}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          asset.status === 'in_use' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          asset.status === 'under_repair' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      ยังไม่มีข้อมูลอุปกรณ์ในระบบ (สามารถเพิ่มข้อมูลได้ที่เมนู Assets)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}