"use client"

import useSWR from "swr"
import Link from "next/link"
import { fetcher, formatDate } from "@/lib/client"
import { Card } from "@/components/ui/card"
import { AssignmentStatusBadge, RoleBadge } from "@/components/status-badge"
import {
  HardDrive, CheckCircle2, PackageCheck, Wrench, KeyRound, AlertTriangle, Users, Clock,
} from "lucide-react"

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n)

export default function DashboardPage() {
  const { data: userData } = useSWR("/api/auth/me", fetcher)
  const { data, isLoading } = useSWR("/api/dashboard", fetcher, { refreshInterval: 15000 })
  
  const user = userData?.user
  const s = data?.summary
  const recent: any[] = data?.recent ?? []
  const byCategory: any[] = data?.byCategory ?? []
  const maxCat = Math.max(1, ...byCategory.map((c) => Number(c.count)))

  return (
    <div className="flex flex-col gap-6">
      {/* Header พร้อมแสดงผู้ใช้งานปัจจุบัน */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your organization&apos;s IT assets.</p>
        </div>

        {/* แสดงผู้ใช้งานปัจจุบันทางขวาบน */}
        {user && (
          <div className="flex items-center gap-3 bg-card border border-border px-3.5 py-2 rounded-xl shadow-sm self-start sm:self-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="text-left leading-tight">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <div className="mt-1">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Assets" value={s?.totalAssets} icon={HardDrive} loading={isLoading} accent="text-primary" />
        <SummaryCard label="In-Use" value={s?.inUse} icon={CheckCircle2} loading={isLoading} accent="text-blue-600" />
        <SummaryCard label="In-Stock" value={s?.inStock} icon={PackageCheck} loading={isLoading} accent="text-emerald-600" />
        <SummaryCard label="Under Repair" value={s?.underRepair} icon={Wrench} loading={isLoading} accent="text-amber-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Employees" value={s?.totalUsers} icon={Users} loading={isLoading} accent="text-foreground" />
        <SummaryCard label="Licenses" value={s?.totalLicenses} icon={KeyRound} loading={isLoading} accent="text-foreground" />
        <SummaryCard label="Expiring ≤30d" value={s?.expiringLicenses} icon={AlertTriangle} loading={isLoading} accent="text-red-600" />
        <SummaryCard label="Overdue Loans" value={s?.overdueAssignments} icon={Clock} loading={isLoading} accent="text-red-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Activity</h2>
            <Link href="/assets" className="text-sm text-primary hover:underline">View all assets</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No activity yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      <span className="font-mono text-xs text-muted-foreground mr-2">{r.asset_tag}</span>
                      {r.asset_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.user_name} · {formatDate(r.actual_return_date || r.checkout_date)}
                    </p>
                  </div>
                  <AssignmentStatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Category breakdown */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Assets by Category</h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No data.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {byCategory.map((c) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate">{c.category}</span>
                    <span className="text-muted-foreground tabular-nums">{fmt(Number(c.count))}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(Number(c.count) / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function SummaryCard({
  label, value, icon: Icon, loading, accent,
}: {
  label: string
  value: number | undefined
  icon: React.ElementType
  loading: boolean
  accent: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight mt-2 tabular-nums">
            {loading ? <span className="text-muted-foreground">—</span> : fmt(value ?? 0)}
          </p>
        </div>
        <div className={`${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}