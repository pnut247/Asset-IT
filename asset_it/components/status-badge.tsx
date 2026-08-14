import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AssetStatus, AssignmentStatus, MaintenanceStatus } from "@/lib/types"

const ASSET_STYLES: Record<AssetStatus, { label: string; className: string }> = {
  in_stock: { label: "In-Stock", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  in_use: { label: "In-Use", className: "bg-blue-100 text-blue-800 border-blue-200" },
  under_repair: { label: "Under Repair", className: "bg-amber-100 text-amber-900 border-amber-200" },
  retired: { label: "Retired", className: "bg-zinc-200 text-zinc-700 border-zinc-300" },
}

const ASSIGN_STYLES: Record<AssignmentStatus, { label: string; className: string }> = {
  checked_out: { label: "Checked Out", className: "bg-blue-100 text-blue-800 border-blue-200" },
  returned: { label: "Returned", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800 border-red-200" },
}

const MAINT_STYLES: Record<MaintenanceStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-red-100 text-red-800 border-red-200" },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-900 border-amber-200" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-zinc-200 text-zinc-700 border-zinc-300" },
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const s = ASSET_STYLES[status] ?? ASSET_STYLES.in_stock
  return <Badge variant="outline" className={cn("font-medium", s.className)}>{s.label}</Badge>
}

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const s = ASSIGN_STYLES[status] ?? ASSIGN_STYLES.checked_out
  return <Badge variant="outline" className={cn("font-medium", s.className)}>{s.label}</Badge>
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const s = MAINT_STYLES[status] ?? MAINT_STYLES.open
  return <Badge variant="outline" className={cn("font-medium", s.className)}>{s.label}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: "bg-primary/10 text-primary border-primary/20",
    staff: "bg-blue-100 text-blue-800 border-blue-200",
    user: "bg-zinc-100 text-zinc-700 border-zinc-200",
  }
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", map[role] ?? map.user)}>
      {role}
    </Badge>
  )
}
