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
    <div className="flex min-h-screen bg-background">
      <AppSidebar user={user} />
      <div className="flex-1 min-w-0 lg:pl-64">
        <main className="p-4 md:p-8 max-w-[1400px] mx-auto">{children}</main>
      </div>
    </div>
  )
}
