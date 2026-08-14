import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { isDbConfigured } from "@/lib/db"
import { AppSidebar } from "@/components/app-sidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isDbConfigured()) {
    redirect("/setup")
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col lg:flex-row">
      {/* Sidebar เมนู */}
      <AppSidebar user={user} />

      {/* กล่องเนื้อหาหลัก */}
      <div className="w-full flex-1 min-w-0 flex flex-col lg:pl-64 min-h-screen">
        <main className="w-full flex-1 p-4 pt-16 lg:pt-8 md:p-8 max-w-[1400px] mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}