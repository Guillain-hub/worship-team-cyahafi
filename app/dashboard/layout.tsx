import type React from "react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import RoleGuard from "@/components/role-guard"
import { Separator } from "@/components/ui/separator"
import { SettingsProvider } from "@/components/settings-provider"
import AdminNotifications from '@/components/admin-notifications'
import DashboardHeader from "@/components/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SettingsProvider>
      <SidebarProvider defaultOpen={false}>
        <RoleGuard />
        <DashboardSidebar />
        <SidebarInset className="bg-background">
        <DashboardHeader />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        </SidebarInset>
      </SidebarProvider>
    </SettingsProvider>
  )
}
