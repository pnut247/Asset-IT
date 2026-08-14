"use client"

import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { Asset } from "@/lib/types"

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: Asset | null
  onSaved: () => void
}

export function AssetFormDialog({ open, onOpenChange, asset, onSaved }: AssetFormDialogProps) {
  const isEdit = !!asset
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    tag_id: "",
    name: "",
    category: "",
    serial_number: "",
    brand: "",
    model: "",
    status: "in_stock",
    assigned_user_name: "",
    department: "",
    purchase_date: "",
    warranty_expire: "",
    price: "",
    invoice_po: "",
    spec: "",
  })

  useEffect(() => {
    if (asset) {
      setForm({
        tag_id: asset.tag_id || "",
        name: asset.name || "",
        category: asset.category || "",
        serial_number: asset.serial_number || "",
        brand: asset.brand || "",
        model: asset.model || "",
        status: asset.status || "in_stock",
        assigned_user_name: (asset as any).assigned_to_name || (asset as any).assigned_user_name || "",
        department: (asset as any).assigned_to_dept || (asset as any).department || "",
        purchase_date: asset.purchase_date ? asset.purchase_date.split("T")[0] : "",
        warranty_expire: asset.warranty_expire ? asset.warranty_expire.split("T")[0] : "",
        price: asset.price != null ? String(asset.price) : "",
        invoice_po: asset.invoice_po || "",
        spec: asset.spec || "",
      })
    } else {
      setForm({
        tag_id: "",
        name: "",
        category: "",
        serial_number: "",
        brand: "",
        model: "",
        status: "in_stock",
        assigned_user_name: "",
        department: "",
        purchase_date: "",
        warranty_expire: "",
        price: "",
        invoice_po: "",
        spec: "",
      })
    }
  }, [asset, open])

  const handleNameChange = (val: string) => {
    setForm((f) => ({
      ...f,
      assigned_user_name: val,
      status: val.trim() ? "in_use" : "in_stock",
    }))
  }

  async function submit() {
    if (!form.tag_id || !form.name) {
      toast.error("Please fill in Asset Tag ID and Item Name")
      return
    }

    setSaving(true)
    try {
      // 🟢 เคลียร์ค่า Date, Price, String ว่างๆ ให้เปลี่ยนเป็น null ป้องกัน Server ตีกลับ 400
      const payload = {
        ...form,
        price: form.price !== "" && !isNaN(Number(form.price)) ? Number(form.price) : null,
        purchase_date: form.purchase_date.trim() ? form.purchase_date : null,
        warranty_expire: form.warranty_expire.trim() ? form.warranty_expire : null,
        category: form.category.trim() || null,
        serial_number: form.serial_number.trim() || null,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        department: form.department.trim() || null,
        invoice_po: form.invoice_po.trim() || null,
        spec: form.spec.trim() || null,
      }

      if (isEdit) {
        await apiRequest(`/api/assets/${asset.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        toast.success("Asset updated successfully")
      } else {
        await apiRequest("/api/assets", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        toast.success("Asset created successfully")
      }

      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save asset")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {isEdit ? "Update IT asset details." : "Register a new IT asset in the system."}
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-2 text-sm">
          {/* Row 1: Asset Tag ID & Item Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Asset Tag ID *</Label>
              <Input
                value={form.tag_id}
                onChange={(e) => setForm((f) => ({ ...f, tag_id: e.target.value }))}
                placeholder="IT-0001"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Item Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Dell Latitude 5540"
              />
            </div>
          </div>

          {/* Row 2: Category & Serial Number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Laptop, Monitor"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Serial Number</Label>
              <Input
                value={form.serial_number}
                onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))}
                placeholder="SN12345678"
              />
            </div>
          </div>

          {/* Row 3: Brand & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Brand</Label>
              <Input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                placeholder="Dell, Lenovo"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Model</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="Latitude 5540"
              />
            </div>
          </div>

          {/* Row 4: Assigned To & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Assigned To</Label>
              <Input
                value={form.assigned_user_name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Username"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Department</Label>
              <Input
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="IT, HR, Finance"
              />
            </div>
          </div>

          {/* Row 5: Status & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In-Stock</SelectItem>
                  <SelectItem value="in_use">In-Use</SelectItem>
                  <SelectItem value="under_repair">Under Repair</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Price (THB)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Row 6: Purchase Date & Warranty Expire */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={form.purchase_date}
                onChange={(e) => setForm((f) => ({ ...f, purchase_date: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Warranty Expire</Label>
              <Input
                type="date"
                value={form.warranty_expire}
                onChange={(e) => setForm((f) => ({ ...f, warranty_expire: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 7: Invoice / PO */}
          <div className="grid gap-1.5">
            <Label>Invoice / PO</Label>
            <Input
              value={form.invoice_po}
              onChange={(e) => setForm((f) => ({ ...f, invoice_po: e.target.value }))}
              placeholder="PO-2026-001"
            />
          </div>

          {/* Row 8: Specification */}
          <div className="grid gap-1.5">
            <Label>Specification</Label>
            <Textarea
              value={form.spec}
              onChange={(e) => setForm((f) => ({ ...f, spec: e.target.value }))}
              placeholder="i7 / 16GB / 512GB SSD"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update Asset" : "Create Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}