"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { apiPost } from "@/lib/client"
import { toast } from "sonner"
import { Boxes, Loader2 } from "lucide-react"

function LoginForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState("admin@company.com")
  const [password, setPassword] = useState("admin123")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await apiPost("/api/auth/login", { email, password })
      toast.success("Signed in successfully")
      
      const next = params.get("next") || "/assets"
      window.location.href = next
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Boxes className="h-5 w-5" />
        </div>
        <span className="font-semibold text-lg">IT AssetHub</span>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Enter your credentials to continue.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="mt-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Sign in
        </Button>
      </form>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">IT AssetHub</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Track every device, license, and repair in one place.
          </h1>
          <p className="text-sidebar-foreground/70 leading-relaxed max-w-md text-pretty">
            A centralized internal system for IT asset lifecycle management.
          </p>
        </div>
        <p className="text-sm text-sidebar-foreground/50">Internal use only. Authorized personnel.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}