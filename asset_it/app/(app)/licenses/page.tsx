"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, KeyRound, ChevronDown, ChevronRight, Monitor, Laptop, Trash2, X } from "lucide-react"
import { fetcher, apiPost } from "@/lib/client"
import type { License } from "@/lib/types"

interface ExtendedLicense extends License {
  assigned_assets?: string
}

function seatUsage(l: License) {
  const pct = l.total_seats > 0 ? Math.round((l.assigned_seats / l.total_seats) * 100) : 0
  return pct
}

export default function LicensesPage() {
  const { data, mutate, isLoading } = useSWR<any>("/api/licenses", fetcher)
  const [openAdd, setOpenAdd] = useState(false)
  const [openAssign, setOpenAssign] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<ExtendedLicense | null>(null)

  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

  // Form สร้าง License
  const [form, setForm] = useState({
    software_name: "",
    license_key: "",
    total_seats: "1",
    expiration_date: "",
  })

  // Form เพิ่มชื่อเครื่อง
  const [assetNameInput, setAssetNameInput] = useState("")

  const licenses: ExtendedLicense[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.licenses)
    ? data.licenses
    : Array.isArray(data)
    ? data
    : []

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // บันทึกสร้าง License ใหม่
  async function submitAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiPost("/api/licenses", {
        ...form,
        total_seats: Number(form.total_seats),
        expiration_date: form.expiration_date || null,
      })
      toast.success("License added successfully")
      setOpenAdd(false)
      setForm({ software_name: "", license_key: "", total_seats: "1", expiration_date: "" })
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add license")
    } finally {
      setSaving(false)
    }
  }

  // บันทึกเพิ่มเครื่องเข้ากับ License
  async function submitAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLicense || !assetNameInput.trim()) return
    setSaving(true)
    try {
      await apiPost("/api/licenses", {
        action: "assign_asset",
        license_id: selectedLicense.id,
        asset_name: assetNameInput.trim(),
      })
      toast.success("Device added to license")
      setOpenAssign(false)
      setAssetNameInput("")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign device")
    } finally {
      setSaving(false)
    }
  }

  // 🔴 ลบเครื่องออกจาก License (Unassign Device)
  async function handleUnassignDevice(licenseId: number, assetName: string) {
    if (!confirm(`ต้องการยกเลิกการผูกเครื่อง "${assetName}" ใช่หรือไม่?`)) return
    try {
      await apiPost("/api/licenses", {
        action: "unassign_asset",
        license_id: licenseId,
        asset_name: assetName,
      })
      toast.success(`Removed ${assetName} from license`)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unassign device")
    }
  }

  // 🟢 ลบ License โดยใช้ fetch DELETE ตรงๆ
  async function handleDelete(id: number) {
    if (!confirm("คุณต้องการลบ License นี้ใช่หรือไม่?")) return
    try {
      const res = await fetch(`/api/licenses?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete license")

      toast.success("License deleted")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete license")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Software Licenses</h1>
          <p className="text-sm text-muted-foreground">Track license keys, seat usage, and assigned devices.</p>
        </div>
        
        <Button onClick={() => setOpenAdd(true)}>
          <Plus className="size-4" />
          Add License
        </Button>

        {/* Modal สำหรับสร้าง License ใหม่ */}
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New License</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitAdd} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Software Name</Label>
                <Input
                  required
                  placeholder="เช่น Windows 11 Pro, Microsoft 365"
                  value={form.software_name}
                  onChange={(e) => setForm({ ...form, software_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>License Key</Label>
                <Input
                  required
                  placeholder="เช่น 123456789101112"
                  value={form.license_key}
                  onChange={(e) => setForm({ ...form, license_key: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Total Seats (จำนวน Seats ทั้งหมดที่ใช้งานได้)</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={form.total_seats}
                  onChange={(e) => setForm({ ...form, total_seats: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Expiration Date</Label>
                <Input
                  type="date"
                  value={form.expiration_date}
                  onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                />
              </div>
              <DialogFooter className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save License"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal สำหรับผูกเครื่องเข้ากับ License */}
        <Dialog open={openAssign} onOpenChange={setOpenAssign}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Device to {selectedLicense?.software_name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitAssign} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Device / Asset Name (ชื่อเครื่องที่ใช้งาน)</Label>
                <Input
                  required
                  placeholder="เช่น BS82 หรือระบุหลายเครื่องคั่นด้วยจุลภาค BS82, BS168"
                  value={assetNameInput}
                  onChange={(e) => setAssetNameInput(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? "Adding..." : "Add Device"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Software</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No licenses yet.
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((l) => {
                  const pct = seatUsage(l)
                  const full = l.assigned_seats >= l.total_seats
                  const isExpanded = !!expandedRows[l.id]
                  const deviceList = l.assigned_assets
                    ? l.assigned_assets.split(",").map((d) => d.trim()).filter(Boolean)
                    : []

                  return (
                    <React.Fragment key={l.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(l.id)}>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="size-6 p-0">
                            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">
                            <KeyRound className="size-4 text-muted-foreground" />
                            {l.software_name}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">{l.license_key}</div>
                        </TableCell>
                        <TableCell>
                          {l.assigned_seats} / {l.total_seats}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className={full ? "h-full bg-destructive" : "h-full bg-primary"}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{pct}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {l.expiration_date ? (
                            <Badge variant="outline">{new Date(l.expiration_date).toLocaleDateString()}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(l.id)
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Dropdown แสดงรายละเอียดเครื่อง และปุ่มเพิ่มเครื่อง */}
                      {isExpanded && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-3 pl-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                  <Monitor className="size-4" />
                                  เครื่องที่กำลังใช้งาน ({deviceList.length} / {l.total_seats} Seats):
                                </div>
                                <Button
                                  size="sm"
                                  variant={full ? "secondary" : "outline"}
                                  disabled={full}
                                  className="h-8 gap-1.5 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (full) {
                                      toast.error("License นี้ใช้งานเต็มจำนวน (100%) แล้ว")
                                      return
                                    }
                                    setSelectedLicense(l)
                                    setOpenAssign(true)
                                  }}
                                >
                                  <Laptop className="size-3.5" />
                                  {full ? "Seats เต็มแล้ว (100%)" : "+ เพิ่มเครื่องที่ใช้ License นี้"}
                                </Button>
                              </div>

                              {deviceList.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {deviceList.map((dev, idx) => (
                                    <Badge key={idx} variant="secondary" className="gap-1 font-mono text-xs pr-1.5">
                                      {dev}
                                      <button
                                        type="button"
                                        className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleUnassignDevice(l.id, dev)
                                        }}
                                      >
                                        <X className="size-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">ยังไม่มีการเพิ่มเครื่องใน License นี้</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}