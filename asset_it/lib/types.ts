export type AssetStatus = "in_stock" | "in_use" | "under_repair" | "retired"
export type AssignmentStatus = "checked_out" | "returned" | "overdue"
export type MaintenanceStatus = "open" | "in_progress" | "completed" | "cancelled"
export type Role = "admin" | "staff" | "user"

export type Asset = {
  id: number
  tag_id: string
  name: string
  category: string | null
  serial_number: string | null
  brand: string | null
  model: string | null
  spec: string | null
  status: AssetStatus
  location: string | null
  purchase_date: string | null
  warranty_expire: string | null
  price: number | null
  invoice_po: string | null
  assigned_to: number | null
  assigned_to_name?: string | null
  created_at: string
  updated_at: string
}

export type Assignment = {
  id: number
  asset_id: number
  user_id: number
  checkout_date: string
  expected_return: string | null
  actual_return_date: string | null
  status: AssignmentStatus
  notes: string | null
  user_name?: string
  asset_name?: string
  asset_tag?: string
}

export type SoftwareLicense = {
  id: number
  software_name: string
  license_key: string | null
  vendor: string | null
  total_seats: number
  assigned_seats: number
  purchase_date: string | null
  expiration_date: string | null
  price: number | null
  notes: string | null
}

export type MaintenanceLog = {
  id: number
  asset_id: number
  issue_detail: string
  repair_cost: number | null
  vendor: string | null
  repair_date: string | null
  status: MaintenanceStatus
  asset_name?: string
  asset_tag?: string
  created_at: string
}

export type DashboardSummary = {
  totalAssets: number
  inUse: number
  inStock: number
  underRepair: number
  retired: number
  totalUsers: number
  totalLicenses: number
  expiringLicenses: number
  openMaintenance: number
  overdueAssignments: number
}

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  in_stock: "In-Stock",
  in_use: "In-Use",
  under_repair: "Under Repair",
  retired: "Retired",
}
