"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type Member = {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  role?: string | { name: string } | null
}

type AuthContextValue = {
  user: Member | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' })
      const json = await res.json()
      setUser(json.user ?? null)
    } catch (e) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function login(identifier: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const json = await res.json()
      if (!res.ok) return { ok: false, error: json.error || 'Login failed' }
      // Server sets HttpOnly cookie; response contains safe member
      setUser(json.member ?? null)
      return { ok: true, member: json.member ?? null }
    } catch (e: any) {
      return { ok: false, error: e?.message ?? 'Network error' }
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
