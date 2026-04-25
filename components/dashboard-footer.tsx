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
    <footer className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/10 bg-background/95 backdrop-blur-xl shadow-inner">
      <div className="mx-auto flex max-w-7xl justify-around px-4 py-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.url
          return (
            <Link
              key={item.url}
              href={item.url}
              aria-label={item.title}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-2xl transition hover:bg-primary/10 hover:text-primary',
                isActive ? 'bg-primary/10 text-primary' : 'text-slate-500',
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </footer>
  )
}
