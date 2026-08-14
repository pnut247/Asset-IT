"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { apiPost } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/status-badge"
import type { SessionUser } from "@/lib/auth"
import {
  Boxes, LayoutDashboard, HardDrive, KeyRound, Wrench, ScanLine, Users, LogOut, Menu, X,
} from "lucide-react"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: HardDrive },
  { href: "/licenses", label: "Licenses", icon: KeyRound },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/scan", label: "Scan QR", icon: ScanLine },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
]

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  async function logout() {
    try {
      await apiPost("/api/auth/logout")
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      window.location.href = "/login"
    }
  }

  const items = NAV.filter((n) => !n.adminOnly || user.role === "admin")

  return (
    <>
      {/* Mobile top bar - ตั้งให้เป็น fixed กว้างเต็มจอ 100% */}
      <div className="fixed top-0 left-0 right-0 w-full lg:hidden flex items-center justify-between border-b border-border bg-sidebar text-sidebar-foreground px-4 h-14 z-30">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-sidebar-primary" />
          <span className="font-semibold">IT AssetHub</span>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="p-2 cursor-pointer">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight">IT AssetHub</span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-semibold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <div className="mt-0.5">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start mt-1 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  )
}