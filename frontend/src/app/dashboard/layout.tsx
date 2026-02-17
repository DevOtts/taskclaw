import { AppSidebar } from '@/components/app-sidebar'
import { AiBubble } from '@/components/ai/ai-bubble'
import { SystemStatusBar } from '@/components/system-status-bar'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserAccounts, getUserDetails, getAccountProjects, getSystemSettings } from "@/app/dashboard/actions"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    interface Account {
        id: string
        name: string
        plan: string
    }

    const accounts: Account[] = await getUserAccounts()
    const user = await getUserDetails()

    // If session is expired or user can't be fetched, redirect to login
    if (!user) {
        redirect('/login')
    }

    const settings = await getSystemSettings()
    const cookieStore = await cookies()
    let activeAccountId = cookieStore.get('current_account_id')?.value

    // Transform accounts to match TeamSwitcher expected format
    const teams = accounts.map(account => ({
        id: account.id,
        name: account.name,
        plan: account.plan,
    }))

    // Find active team or default to first
    const activeTeam = teams.find(t => t.id === activeAccountId) || teams[0]
    
    // Set cookie if not present, or fix stale cookie referencing a non-existent account
    if ((!activeAccountId || !teams.find(t => t.id === activeAccountId)) && activeTeam) {
        activeAccountId = activeTeam.id
        cookieStore.set('current_account_id', activeAccountId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        })
    }

    // Fetch projects for active team
    interface Project {
        id: string
        name: string
        url: string
    }
    const projectsData: Project[] = activeTeam ? await getAccountProjects(activeTeam.id) : []

    const projects = projectsData.map(p => ({
        id: p.id,
        name: p.name,
        url: p.url,
    }))

    return (
        <SidebarProvider>
            <AppSidebar
                user={user ? { ...user, email: user.email || '', role: user.role } : null}
                teams={teams}
                activeTeam={activeTeam}
                projects={projects}
                allowMultipleProjects={settings?.allow_multiple_projects ?? true}
                allowMultipleTeams={settings?.allow_multiple_teams ?? true}
            />
            <SidebarInset>
                <div className="flex flex-col h-screen min-h-0 overflow-hidden">
                    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard">
                                            Dashboard
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-0 overflow-y-auto">
                        {children}
                    </div>
                    <div className="sticky bottom-0 z-30 shrink-0">
                        <SystemStatusBar />
                    </div>
                </div>
            </SidebarInset>
            {/* <AiBubble /> */}
        </SidebarProvider>
    )
}
