import type React from "react"
import RoleGuard from "@/components/role-guard"
import { SettingsProvider } from "@/components/settings-provider"
import DashboardHeader from "@/components/dashboard-header"
import DashboardFooter from "@/components/dashboard-footer"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SettingsProvider>
      <RoleGuard />
      <div className="dark min-h-screen bg-slate-950 text-slate-100">
        <DashboardHeader />
        <main className="flex-1 min-h-[calc(100vh-7rem)] pb-24 px-3 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
        <DashboardFooter />
      </div>
    </SettingsProvider>
  )
}
