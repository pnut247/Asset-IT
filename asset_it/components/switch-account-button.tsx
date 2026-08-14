"use client"

export function SwitchAccountButton() {
  async function handleSwitchAccount() {
    try {
      // ยิง API ลบ Session
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (e) {
      console.error(e)
    } finally {
      // 🟢 ล้าง Cache และบังคับเบราว์เซอร์เปิดหน้า /login ใหม่ทันที
      window.location.href = "/login"
    }
  }

  return (
    <button
      type="button"
      onClick={handleSwitchAccount}
      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition border border-slate-700 cursor-pointer"
    >
      Sign In / Switch Account
    </button>
  )
}