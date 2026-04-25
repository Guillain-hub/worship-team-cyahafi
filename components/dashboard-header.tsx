"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, LogOut } from "lucide-react"
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-[0_12px_48px_-24px_rgba(0,0,0,0.8)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <div className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm shadow-black/10">
          <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Home className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Dashboard</p>
            <h1 className="truncate text-base font-semibold text-white sm:text-xl">Worship Team Cyahafi</h1>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-slate-400">Premium Platform</div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-slate-400">Secure Cloud</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <AdminNotifications />
          <Separator orientation="vertical" className="hidden h-8 md:block" />
          {/* <ThemeToggle /> */}
          <Link href="/" className="hidden sm:inline-flex" style={{ touchAction: 'manipulation' }}>
            <Button
              variant="ghost"
              size="lg"
              className="gap-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
              type="button"
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleLogout}
            className="gap-2 rounded-3xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-200 hover:text-white hover:bg-red-500/20 transition-colors"
            type="button"
            style={{ touchAction: 'manipulation' }}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
