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
import { Plus, Users, Pencil, Trash2 } from "lucide-react"

export default function UsersPage() {
  const { data, isLoading, mutate } = useSWR<{ users: User[] }>("/api/users", fetcher)
  
  // State สำหรับ Create Dialog
  const [openCreate, setOpenCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    department: "",
  })

  // State สำหรับ Edit Dialog
  const [openEdit, setOpenEdit] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    department: "",
    role: "admin",
  })

  const users = data?.users ?? []

  function resetCreate() {
    setForm({ name: "", username: "", password: "", department: "" })
  }

  // ฟังก์ชันสร้าง User ใหม่
  async function submitCreate() {
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
      toast.success("Created New Admin Successfully")
      setOpenCreate(false)
      resetCreate()
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setSaving(false)
    }
  }

  // เปิด Dialog แก้ไขข้อมูล พร้อมใส่ข้อมูลเดิม
  function handleOpenEdit(u: any) {
    setEditingUser(u)
    setEditForm({
      name: u.name || "",
      username: u.username || u.email || "",
      department: u.department || "",
      role: u.role || "admin",
    })
    setOpenEdit(true)
  }

  // ฟังก์ชันอัปเดตข้อมูล User
  async function submitEdit() {
    if (!editingUser) return
    if (!editForm.name.trim() || !editForm.username.trim()) {
      toast.error("กรุณากรอกชื่อและ Username ให้ครบถ้วน")
      return
    }

    setSaving(true)
    try {
      await apiRequest(`/api/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editForm.name.trim(),
          username: editForm.username.trim(),
          department: editForm.department.trim(),
          role: editForm.role,
        }),
      })
      toast.success("Update User Successfully")
      setOpenEdit(false)
      setEditingUser(null)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  // ฟังก์ชันลบ User
  async function handleDelete(id: number, name: string) {
    if (!confirm(`คุณต้องการลบผู้ใช้งาน "${name}" ใช่หรือไม่?`)) return

    try {
      await apiRequest(`/api/users/${id}`, {
        method: "DELETE",
      })
      toast.success("Deleted User Successfully")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
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

        {/* Dialog สำหรับสร้างผู้ใช้ใหม่ */}
        <Dialog
          open={openCreate}
          onOpenChange={(o) => {
            setOpenCreate(o)
            if (!o) resetCreate()
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
              <Button onClick={submitCreate} disabled={saving}>
                {saving ? "Saving..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog สำหรับแก้ไขข้อมูลผู้ใช้ */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Username</Label>
              <Input
                value={editForm.username}
                onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Department</Label>
              <Input
                value={editForm.department}
                onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
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
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(u)}
                        >
                          <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(u.id, u.name)}
                        >
                          <Trash2 className="size-4 text-red-500 hover:text-red-600" />
                        </Button>
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