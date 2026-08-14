"use client"

import { useState } from "react"
import useSWR from "swr"
import { fetcher, apiRequest } from "@/lib/client"
import type { User } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Users } from "lucide-react"

export default function UsersPage() {
  const { data, isLoading, mutate } = useSWR<{ users: User[] }>("/api/users", fetcher)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    department: "",
  })

  const users = data?.users ?? []

  function reset() {
    setForm({ name: "", username: "", password: "", department: "" })
  }

  async function submit() {
    if (!form.name.trim() || !form.username.trim() || !form.password) {
      toast.error("กรุณากรอกชื่อ, Username และรหัสผ่านให้ครบถ้วน")
      return
    }
    if (form.password.length < 6) {
      toast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร")
      return
    }

    setSaving(true)
    try {
      await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim(),
          password: form.password,
          role: "admin",
          department: form.department.trim(),
        }),
      })
      toast.success("สร้างผู้ใช้งาน Admin สำเร็จ")
      setOpen(false)
      reset()
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setSaving(false)
    }
  }

  const roleColor: Record<string, string> = {
    admin: "bg-primary/10 text-primary border-primary/20",
    staff: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    user: "bg-muted text-muted-foreground border-border",
    Admin: "bg-primary/10 text-primary border-primary/20",
    Staff: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    User: "bg-muted text-muted-foreground border-border",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Users &amp; Employees
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts and access roles.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (!o) reset()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User (Admin Role)</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="เช่น สมชาย ใจดี"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Username</Label>
                <Input
                  type="text"
                  placeholder="เช่น somchai.j"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Department</Label>
                <Input
                  placeholder="เช่น IT, Accounting"
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, department: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={saving}>
                {saving ? "Saving..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-muted-foreground" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.username || u.email}</TableCell>
                      <TableCell>{u.department ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColor[u.role] || roleColor.User}>
                          {u.role}
                        </Badge>
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