"use client"

import { use, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { fetcher, formatCurrency, formatDate } from "@/lib/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { AssetStatusBadge, AssignmentStatusBadge, MaintenanceStatusBadge } from "@/components/status-badge"
import { AssetQR } from "@/components/asset-qr"
import { CheckoutDialog } from "@/components/checkout-dialog"
import { ArrowLeft, ArrowLeftRight, Loader2 } from "lucide-react"

export default function AssetDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = use(params)
  const { data, isLoading, mutate } = useSWR(`/api/assets/${tag}`, fetcher)
  const { data: me } = useSWR("/api/auth/me", fetcher)
  const canManage = me?.user?.role === "admin" || me?.user?.role === "staff"
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  if (isLoading) {
    return <div className="flex items-center gap-2 text-muted-foreground py-20 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
  }
  if (!data?.asset) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Asset not found.</p>
        <Button asChild variant="link"><Link href="/assets">Back to assets</Link></Button>
      </div>
    )
  }

  const a = data.asset
  const assignments: any[] = data.assignments ?? []
  const maintenance: any[] = data.maintenance ?? []

  const details: [string, React.ReactNode][] = [
    ["Category", a.category || "—"],
    ["Serial Number", a.serial_number || "—"],
    ["Brand", a.brand || "—"],
    ["Model", a.model || "—"],
    ["Specification", a.spec || "—"],
    ["Location", a.location || "—"],
    ["Assigned To", a.assigned_to_name || "—"],
    ["Purchase Date", formatDate(a.purchase_date)],
    ["Warranty Expire", formatDate(a.warranty_expire)],
    ["Price", formatCurrency(a.price)],
    ["Invoice / PO", a.invoice_po || "—"],
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/assets"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{a.name}</h1>
            <AssetStatusBadge status={a.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground mt-1">{a.tag_id}</p>
        </div>
        {canManage && (a.status === "in_stock" || a.status === "in_use") && (
          <Button onClick={() => setCheckoutOpen(true)}>
            <ArrowLeftRight className="h-4 w-4" />
            {a.status === "in_use" ? "Check In" : "Check Out"}
          </Button>
        )}
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="font-semibold mb-4">Asset Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {details.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-4">Checkout History</h2>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No checkout history.</p>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Checkout</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Returned</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.user_name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(r.checkout_date)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(r.expected_return)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(r.actual_return_date)}</TableCell>
                        <TableCell><AssignmentStatusBadge status={r.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-4">Maintenance Logs</h2>
            {maintenance.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No maintenance records.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {maintenance.map((m) => (
                  <div key={m.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm">{m.issue_detail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {m.vendor || "—"} · {formatDate(m.repair_date)} · {formatCurrency(m.repair_cost)}
                      </p>
                    </div>
                    <MaintenanceStatusBadge status={m.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-5 sticky top-6">
            <h2 className="font-semibold mb-1">Asset QR Code</h2>
            <p className="text-xs text-muted-foreground mb-4">Print and attach to the physical device.</p>
            <Separator className="mb-4" />
            <AssetQR tag={a.tag_id} name={a.name} />
          </Card>
        </div>
      </div>

      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} asset={a} onDone={() => mutate()} />
    </div>
  )
}
