"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { usePathname, useRouter } from "next/navigation"

export default function RoleGuard() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // 🔹 FIX 3: Delay redirect until role is guaranteed
    if (loading) return
    
    if (!user) return
    
    const role = typeof user?.role === 'object' ? user.role?.name : user?.role
    
    // 🔹 FIX 2: NEVER default to leader - explicitly check role
    // Prevent Members from accessing admin/leader dashboard
    if (role === 'Member') {
      // Allow member to access only their profile and settings
      const isAllowedPath = pathname?.startsWith('/dashboard/member') || pathname?.startsWith('/dashboard/settings')
      const isDashboardPath = pathname?.startsWith('/dashboard')
      
      if (isDashboardPath && !isAllowedPath) {
        router.replace('/dashboard/member')
      }
    }
  }, [user, loading, pathname, router])

  return null
}
