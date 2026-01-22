"use client"

import { useEffect } from 'react'
import { useAuth } from './auth-provider'
import { useToast } from '@/components/ui/use-toast'

export default function AdminNotifications() {
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return
    const role = typeof user.role === 'object' ? (user.role as any)?.name : user.role
    if (role !== 'Admin' && role !== 'Leader') return

    let mounted = true
    fetch('/api/admin/notifications')
      .then(r => r.json())
      .then((j) => {
        if (!mounted) return
        const notifs = j.notifications || []
        for (const n of notifs) {
          if (n.type === 'birthday') {
            const name = n.fullName || 'A member'
            const date = n.birthDate ? (new Date(n.birthDate)).toLocaleDateString() : ''
            const lead = Number(n.leadDays || 0)
            const desc = lead > 0 ? `${name} has a birthday in ${lead} day${lead > 1 ? 's' : ''} (${date})` : `${name} has a birthday ${date}`
            toast({ title: 'Birthday', description: desc })
          }
        }
      }).catch(() => {})

    return () => { mounted = false }
  }, [user, toast])

  return null
}
