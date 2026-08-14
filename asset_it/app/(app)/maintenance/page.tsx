"use client"

import { useState } from "react"
import useSWR from "swr"
import { fetcher, apiRequest } from "@/lib/client"
import type { MaintenanceLog, Asset } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AssetStatusBadge } from "@/components/status-badge"
import { toast } from "sonner"
import { Plus, Wrench } from "lucide-react"

const REPAIR_STATUSES = ["Open", "In-Progress", "Completed", "Cancelled"] as const

export default function MaintenancePage() {
  const { data, isLoading, mutate } = useSWR<{ logs: MaintenanceLog[] }>(
    "/api/maintenance",
    fetcher,
  )
  const { data: assetData } = useSWR<{ assets: Asset[]; total: number }>(
    "/api/assets?pageSize=500",
    fetcher,
  )
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    asset_id: "",
    issue_detail: "",
    vendor: "",
    repair_cost: "",
    repair_date: "",
    status: "Open",
  })

  const logs = data?.logs ?? []
  const assets = assetData?.assets ?? []

  function reset() {
    setForm({
      asset_id: "",
      issue_detail: "",
      vendor: "",
      repair_cost: "",
      repair_date: "",
      status: "Open",
    })
  }

  async function submit() {
    if (!form.asset_id || !form.issue_detail) {
      toast.error("Please select an asset and describe the issue")
      return
    }
    setSaving(true)
    try {
      await apiRequest("/api/maintenance", {
        method: "POST",
        body: JSON.stringify({
          asset_id: Number(form.asset_id),
          issue_detail: form.issue_detail,
          vendor: form.vendor || null,
          repair_cost: form.repair_cost ? Number(form.repair_cost) : null,
          repair_date: form.repair_date || null,
          status: form.status,
        }),
      })
      toast.success("Maintenance log created")
      setOpen(false)
      reset()
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create log")
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await apiRequest(`/api/maintenance/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      toast.success("Status updated")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Maintenance Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Track repairs, service centers, and costs.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (!o) reset()
          }}
        >
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 size-4" />
              New Log
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Maintenance Log</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Asset</Label>
                <Select
                  value={form.asset_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, asset_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.asset_tag} — {a.item_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Issue Detail</Label>
                <Textarea
                  value={form.issue_detail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, issue_detail: e.target.value }))
                  }
                  placeholder="Describe the problem..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Vendor / Service Center</Label>
                  <Input
                    value={form.vendor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vendor: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Repair Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.repair_cost}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, repair_cost: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Repair Date</Label>
                  <Input
                    type="date"
                    value={form.repair_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, repair_date: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPAIR_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={saving}>
                {saving ? "Saving..." : "Create Log"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="size-4 text-muted-foreground" />
            Repair History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Repair Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No maintenance logs yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {log.asset_tag}
                        <div className="font-sans text-muted-foreground">{log.item_name}</div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.issue_detail}</TableCell>
                      <TableCell>{log.vendor ?? "—"}</TableCell>
                      <TableCell>
                        {log.repair_cost != null
                          ? `$${Number(log.repair_cost).toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {log.repair_date
                          ? new Date(log.repair_date).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={log.status}
                          onValueChange={(v) => updateStatus(log.id, v)}
                        >
                          {/* ✅ แก้ไข: ใช้ SelectValue แทนการยัด Badge เข้า <SelectTrigger> โดยตรงเพื่อป้องกัน button ซ้อนกัน */}
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REPAIR_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}