"use client"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, Calendar, HandCoins, Settings, Music2, FileDown, LogOut, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Members",
    url: "/dashboard/members",
    icon: Users,
  },
  {
    title: "Activities",
    url: "/dashboard/activities",
    icon: Calendar,
  },
  {
    title: "Contributions",
    url: "/dashboard/contributions",
    icon: HandCoins,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileDown,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

const adminItems = [
  {
    title: "Content Manager",
    url: "/dashboard/content-management",
    icon: Palette,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { setOpen } = useSidebar()

  const userRole = typeof user?.role === 'object' ? user.role?.name : user?.role

  const visibleItems = userRole === 'Member'
    ? [
        {
          title: "My Profile",
          url: "/dashboard/member",
          icon: Users,
        },
        {
          title: "Settings",
          url: "/dashboard/settings",
          icon: Settings,
        },
      ]
    : userRole === 'Leader'
    ? [
        items[0], // Overview
        items[1], // Members
        items[2], // Activities
        items[3], // Contributions
        items[5], // Settings (skip Reports)
      ]
    : userRole === 'Admin'
    ? [...items.slice(0, 5), ...adminItems, items[5]]
    : items

  const handleNavigate = () => {
    setOpen(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
            <Music2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none min-w-0">
            <span className="font-semibold text-sm truncate">ADEPR Cyahafi</span>
            <span className="text-xs text-muted-foreground truncate">Worship Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-4">
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                tooltip={item.title}
                className="hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
              >
                <Link href={item.url} onClick={handleNavigate}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <div className="flex items-center justify-center">
          <Button size="sm" variant="ghost" onClick={async () => { await logout(); router.replace('/login') }}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
