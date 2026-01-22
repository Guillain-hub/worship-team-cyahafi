"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { usePathname, useRouter } from "next/navigation"

export default function RoleGuard() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const role = typeof user?.role === 'object' ? user.role?.name : user?.role
    
    // Prevent Members from accessing admin/leader dashboard
    if (user && role === 'Member') {
      // Allow member to access only their profile and settings
      if (!pathname?.startsWith('/dashboard/member') && !pathname?.startsWith('/dashboard/settings') && pathname?.startsWith('/dashboard')) {
        router.replace('/dashboard/member')
      }
    }
  }, [user, loading, pathname, router])

  return null
}
