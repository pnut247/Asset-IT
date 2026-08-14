"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import Link from "next/link"
import { fetcher } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AssetStatusBadge } from "@/components/status-badge"
import { AssetFormDialog } from "@/components/asset-form-dialog"
import { CheckoutDialog } from "@/components/checkout-dialog"
import { Search, Plus, Eye, Pencil, ArrowLeftRight, ChevronLeft, ChevronRight, User, Building } from "lucide-react"
import type { Asset } from "@/lib/types"

type AssetWithUser = Asset & {
  assigned_user_name?: string
  assigned_user_dept?: string
  assigned_to_name?: string
  assigned_to_dept?: string
}

export default function AssetsPage() {
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [status, setStatus] = useState("all")
  const [category, setCategory] = useState("all")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [formOpen, setFormOpen] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutAsset, setCheckoutAsset] = useState<Asset | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => setPage(1), [debounced, status, category])

  const { data: me } = useSWR("/api/auth/me", fetcher)
  const canManage = me?.user?.role === "admin" || me?.user?.role === "staff"

  const { data: catData } = useSWR("/api/categories", fetcher)
  const categories: string[] = catData?.categories ?? []

  const params = new URLSearchParams({
    search: debounced,
    page: String(page),
    pageSize: String(pageSize),
  })
  if (status !== "all") params.set("status", status)
  if (category !== "all") params.set("category", category)

  const { data, isLoading, mutate } = useSWR(`/api/assets?${params.toString()}`, fetcher, {
    keepPreviousData: true,
  })
  const assets: AssetWithUser[] = data?.assets ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  function openCreate() {
    setEditAsset(null)
    setFormOpen(true)
  }
  function openEdit(a: Asset) {
    setEditAsset(a)
    setFormOpen(true)
  }
  function openCheckout(a: Asset) {
    setCheckoutAsset(a)
    setCheckoutOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} total assets in inventory.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        )}
      </header>

      <Card className="p-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, serial, tag, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="in_stock">In-Stock</SelectItem>
              <SelectItem value="in_use">In-Use</SelectItem>
              <SelectItem value="under_repair">Under Repair</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Serial No.</TableHead>
                <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
                <TableHead className="hidden lg:table-cell">Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && assets.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : assets.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No assets found.</TableCell></TableRow>
              ) : (
                assets.map((a) => {
                  const userName = a.assigned_user_name || a.assigned_to_name
                  const userDept = a.assigned_user_dept || a.assigned_to_dept

                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.tag_id}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{a.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{a.category || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground font-mono text-xs">{a.serial_number || "—"}</TableCell>
                      
                      {/* 🟢 คอลัมน์ 1: แสดงชื่อผู้ถือครองเครื่อง */}
                      <TableCell className="hidden lg:table-cell">
                        {userName ? (
                          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            {userName}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">— Unassigned —</span>
                        )}
                      </TableCell>

                      {/* 🟢 คอลัมน์ 2: แสดงแผนก (แยกคอลัมน์ต่างหาก) */}
                      <TableCell className="hidden lg:table-cell">
                        {userName && userDept ? (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {userDept}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </TableCell>

                      <TableCell><AssetStatusBadge status={a.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="View">
                            <Link href={`/assets/${a.tag_id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                          {canManage && (
                            <>
                              <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(a)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {(a.status === "in_stock" || a.status === "in_use") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={a.status === "in_use" ? "Check In" : "Check Out"}
                                  onClick={() => openCheckout(a)}
                                >
                                  <ArrowLeftRight className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <AssetFormDialog open={formOpen} onOpenChange={setFormOpen} asset={editAsset} onSaved={() => mutate()} />
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} asset={checkoutAsset} onDone={() => mutate()} />
    </div>
  )
}