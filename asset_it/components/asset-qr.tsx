"use client"

import { useRef } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"

/**
 * Renders a QR code that encodes the asset detail URL (…/assets/{tag}).
 * The scanner page reads this value and navigates to the asset.
 */
export function AssetQR({ tag, name }: { tag: string; name: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)

  // Encode an absolute path so scans work from any device on the network.
  const value =
    typeof window !== "undefined" ? `${window.location.origin}/assets/${tag}` : `/assets/${tag}`

  function downloadPng() {
    const canvas = wrapRef.current?.querySelector("canvas")
    if (!canvas) return
    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `${tag}-qr.png`
    a.click()
  }

  function printSticker() {
    const canvas = wrapRef.current?.querySelector("canvas")
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    const w = window.open("", "_blank", "width=400,height=500")
    if (!w) return
    w.document.write(`
      <html><head><title>Asset Sticker ${tag}</title>
      <style>
        body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0}
        .sticker{border:2px solid #111;border-radius:8px;padding:16px;text-align:center;width:220px}
        img{width:180px;height:180px}
        .tag{font-family:monospace;font-weight:700;font-size:18px;margin-top:8px}
        .name{font-size:12px;color:#444;margin-top:2px}
      </style></head>
      <body><div class="sticker">
        <img src="${dataUrl}" alt="QR ${tag}" />
        <div class="tag">${tag}</div>
        <div class="name">${name}</div>
      </div>
      <script>window.onload=function(){window.print();}</script>
      </body></html>
    `)
    w.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={wrapRef} className="rounded-lg border border-border bg-white p-4">
        <QRCodeCanvas value={value} size={168} level="M" includeMargin={false} />
      </div>
      <div className="flex gap-2 w-full">
        <Button variant="outline" size="sm" className="flex-1" onClick={printSticker}>
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={downloadPng}>
          <Download className="h-4 w-4" /> PNG
        </Button>
      </div>
    </div>
  )
}
