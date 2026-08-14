import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { destroySession } from "@/lib/auth"

export async function POST() {
  try {
    // 1. เรียกใช้ destroySession (ถ้ามี)
    try {
      await destroySession()
    } catch (e) {
      console.error("destroySession error:", e)
    }

    // 2. สั่งลบ Cookie บน Browser โดยตรง (ลบทุกชื่อที่เป็นไปได้เพื่อป้องกัน Error)
    const cookieStore = await cookies()
    cookieStore.delete("session_token")
    cookieStore.delete("session")
    cookieStore.delete("auth_token")

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Logout API Error:", err)
    // แม้จะ Error ก็ตอบ 200 กลับไปเพื่อให้อย่างน้อยฝั่ง Client ยอมเปลี่ยนหน้าได้
    return NextResponse.json({ ok: true })
  }
}