export async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || "Request failed") as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function apiPost(url: string, body?: any, method = "POST") {
  // 🟢 เช็กว่าถ้า body เป็น string อยู่แล้ว ไม่ต้อง JSON.stringify ซ้ำ
  const formattedBody = typeof body === "string" ? body : body ? JSON.stringify(body) : undefined

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: formattedBody,
  })
  
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // 🟢 ดึงข้อความ error จาก server มาแสดงถ้ามี
    throw new Error(data.error || data.message || "Request failed")
  }
  return data
}

// 🟢 ปรับ apiRequest ให้แกะ method และ body ไปให้ apiPost อย่างถูกต้อง
export async function apiRequest(
  url: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
) {
  const { method = "GET", body } = options
  return apiPost(url, body, method)
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—"
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(
    Number(value),
  )
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}