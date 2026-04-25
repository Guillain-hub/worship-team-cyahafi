import type { LucideIcon } from "lucide-react"
import { LayoutDashboard, Users, Calendar, HandCoins, Settings, FileDown, Palette } from "lucide-react"

type DashboardNavItem = {
  title: string
  url: string
  icon: LucideIcon
}

const items: DashboardNavItem[] = [
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

const adminItems: DashboardNavItem[] = [
  {
    title: "Content Manager",
    url: "/dashboard/content-management",
    icon: Palette,
  },
]

export function getDashboardNavItems(userRole?: string | null) {
  const normalizedRole = typeof userRole === 'object' ? userRole?.name : userRole

  if (normalizedRole === 'Member') {
    return [
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
  }

  if (normalizedRole === 'Leader') {
    return [
      items[0],
      items[1],
      items[2],
      items[3],
      items[5],
    ]
  }

  if (normalizedRole === 'Admin') {
    return [...items.slice(0, 5), ...adminItems, items[5]]
  }

  return items
}
