"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ScanLine, Search, CameraOff } from "lucide-react"

export default function ScanPage() {
  const router = useRouter()
  const [active, setActive] = useState(true)
  const [manual, setManual] = useState("")
  const [error, setError] = useState<string | null>(null)

  const go = useCallback(
    (raw: string) => {
      // QR may encode a full URL (…/assets/IT-0001) or just the tag.
      const trimmed = raw.trim()
      const tag = trimmed.includes("/assets/") ? trimmed.split("/assets/").pop()!.split(/[?#]/)[0] : trimmed
      if (!tag) return
      router.push(`/assets/${encodeURIComponent(tag)}`)
    },
    [router],
  )

  const handleScan = useCallback(
    (codes: IDetectedBarcode[]) => {
      const value = codes[0]?.rawValue
      if (value) {
        setActive(false)
        toast.success(`Scanned: ${value}`)
        go(value)
      }
    },
    [go],
  )

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Scan Asset</h1>
        <p className="text-sm text-muted-foreground">
          Point your camera at an asset QR code to open its record instantly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="size-4 text-primary" />
            Camera Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border bg-muted aspect-square">
            {active && !error ? (
              <Scanner
                onScan={handleScan}
                onError={(err) => setError(err instanceof Error ? err.message : "Camera unavailable")}
                constraints={{ facingMode: "environment" }}
                classNames={{ container: "h-full w-full", video: "h-full w-full object-cover" }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <CameraOff className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {error ? error : "Scanner paused."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null)
                    setActive(true)
                  }}
                >
                  Restart camera
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-pretty">
            If the camera doesn&apos;t start, ensure you&apos;ve granted camera permission and are on a secure (HTTPS)
            connection.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enter tag manually</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (manual.trim()) go(manual)
            }}
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="manual-tag">Asset Tag</Label>
              <Input
                id="manual-tag"
                placeholder=". IT-0001"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Search className="size-4" />
              Find
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
