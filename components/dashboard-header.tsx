"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, LogOut } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import AdminNotifications from "@/components/admin-notifications"
import { useAuth } from "@/components/auth-provider"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardHeader() {
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
  }

  return (
    <header className="flex h-16 sm:h-20 shrink-0 items-center gap-3 border-b bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 px-4 sm:px-6 transition-[width,height] ease-linear shadow-sm z-40">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <SidebarTrigger className="pointer-events-auto hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors z-50 flex-shrink-0" type="button" style={{ touchAction: 'manipulation' }} />
        <Separator orientation="vertical" className="mr-1 h-6 flex-shrink-0" />
        <h1 className="text-sm sm:text-lg font-semibold text-primary truncate">Worship Team Cyahafi</h1>
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <AdminNotifications />
        <Separator orientation="vertical" className="h-8" />
        <ThemeToggle />
        <Separator orientation="vertical" className="h-8" />
        <Link href="/" className="pointer-events-auto" style={{ touchAction: 'manipulation' }}>
          <Button
            variant="ghost"
            size="lg"
            className="gap-2 text-sm pointer-events-auto hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
            type="button"
          >
            <Home className="h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleLogout}
          className="gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950 pointer-events-auto transition-colors"
          type="button"
          style={{ touchAction: 'manipulation' }}
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}
