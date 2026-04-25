"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getDashboardNavItems } from "@/components/dashboard-nav-items"

export default function DashboardFooter() {
  const pathname = usePathname()
  const { user } = useAuth()
  const userRole = typeof user?.role === 'object' ? user.role?.name : user?.role
  const visibleItems = getDashboardNavItems(userRole)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-inner">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.url
          return (
            <Link
              key={item.url}
              href={item.url}
              aria-label={item.title}
              className={cn(
                'inline-flex min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-3xl border px-3 py-2 text-xs font-semibold transition-all duration-200',
                isActive
                  ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white',
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="whitespace-nowrap">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </footer>
  )
}
