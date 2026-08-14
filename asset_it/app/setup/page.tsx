"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { apiPost } from "@/lib/client"
import { toast } from "sonner"
import { Database, Loader2, CheckCircle2 } from "lucide-react"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState("")

  async function runSetup() {
    setLoading(true)
    try {
      const res = await apiPost("/api/setup")
      setDone(true)
      setMessage(res.message || "Setup complete.")
      toast.success("Database initialized")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Setup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary mb-4">
          <Database className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Database Setup</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          This creates all tables (users, assets, assignments, licenses, maintenance logs) and seeds demo
          data including default accounts. Make sure <code className="font-mono text-foreground">DATABASE_URL</code>{" "}
          is set in Project Settings → Vars before running.
        </p>

        <ol className="mt-6 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Add your MySQL connection string as <code className="font-mono text-foreground">DATABASE_URL</code>.</li>
          <li>Click the button below to create the schema and seed data.</li>
          <li>Sign in with a demo account.</li>
        </ol>

        {done ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
            <Button asChild>
              <Link href="/login">Continue to sign in</Link>
            </Button>
          </div>
        ) : (
          <Button onClick={runSetup} disabled={loading} className="mt-6 w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Run database setup
          </Button>
        )}
      </Card>
    </main>
  )
}
