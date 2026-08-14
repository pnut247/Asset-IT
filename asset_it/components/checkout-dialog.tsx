"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { fetcher, apiPost } from "@/lib/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Asset } from "@/lib/types"

export function CheckoutDialog({
  open, onOpenChange, asset, onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  asset: Asset | null
  onDone: () => void
}) {
  const { data } = useSWR(open ? "/api/users" : null, fetcher)
  const users: any[] = data?.users ?? []
  const [userId, setUserId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [saving, setSaving] = useState(false)

  const isCheckin = asset?.status === "in_use"

  async function submit() {
    if (!asset) return
    setSaving(true)
    try {
      if (isCheckin) {
        await apiPost("/api/assets/checkin", { asset_id: asset.id })
        toast.success("Asset checked in")
      } else {
        if (!userId) {
          toast.error("Please select an employee")
          setSaving(false)
          return
        }
        await apiPost("/api/assets/checkout", {
          asset_id: asset.id,
          user_id: Number(userId),
          due_date: dueDate || null,
        })
        toast.success("Asset checked out")
      }
      onOpenChange(false)
      setUserId("")
      setDueDate("")
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isCheckin ? "Check In Asset" : "Check Out Asset"}</DialogTitle>
          <DialogDescription>
            {asset && (
              <span>
                <span className="font-mono text-xs mr-1">{asset.tag_id}</span>
                {asset.name}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isCheckin ? (
          <p className="text-sm text-muted-foreground">
            This will return the asset to stock and record the return date. Currently assigned to{" "}
            <span className="font-medium text-foreground">{asset?.assigned_to_name || "—"}</span>.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Assign to Employee *</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} — {u.department || u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Expected Return Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isCheckin ? "Confirm Check In" : "Confirm Check Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
