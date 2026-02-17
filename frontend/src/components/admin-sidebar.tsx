"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Building2,
    FolderKanban,
    Settings,
    Palette,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"

const adminNavItems = [
    {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
        items: [],
    },
    {
        title: "Users",
        url: "/admin/users",
        icon: Users,
        items: [],
    },
    {
        title: "Plans",
        url: "/admin/plans",
        icon: CreditCard,
        items: [],
    },
    {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
        items: [],
    },
    {
        title: "Appearance",
        url: "/admin/settings/appearance",
        icon: Palette,
        items: [],
    },
    {
        title: "Accounts",
        url: "/admin/accounts",
        icon: Building2,
        items: [],
    },
    {
        title: "Projects",
        url: "/admin/projects",
        icon: FolderKanban,
        items: [],
    },
]

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: { name: string; email: string; avatar: string } | null
}

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/admin">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <LayoutDashboard className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Admin Panel</span>
                                    <span className="truncate text-xs">Super Admin</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={adminNavItems} />
            </SidebarContent>
            <SidebarFooter>
                {user && <NavUser user={user} />}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
