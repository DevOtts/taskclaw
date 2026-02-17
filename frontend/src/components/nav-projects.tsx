"use client"

import {
    Folder,
    Forward,
    MoreHorizontal,
    Trash2,
    Plus,
    type LucideIcon,
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

import { useRouter } from "next/navigation"
import { deleteProject } from "@/app/dashboard/actions"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { toast } from "sonner"

export function NavProjects({
    projects,
    activeTeamId,
}: {
    projects: {
        id: string
        name: string
        url: string
        icon: LucideIcon
    }[]
    activeTeamId?: string
}) {
    const { isMobile } = useSidebar()
    const router = useRouter()

    const handleDelete = async (projectId: string) => {
        if (confirm("Are you sure you want to delete this project?")) {
            const result = await deleteProject(projectId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Project deleted successfully')
                router.refresh()
            }
        }
    }

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
                {projects.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild>
                            <a href={item.url}>
                                <item.icon />
                                <span className="truncate">{item.name}</span>
                            </a>
                        </SidebarMenuButton>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuAction showOnHover suppressHydrationWarning>
                                    <MoreHorizontal />
                                    <span className="sr-only">More</span>
                                </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-48 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align={isMobile ? "end" : "start"}
                            >
                                <DropdownMenuItem>
                                    <Folder className="text-muted-foreground" />
                                    <span>View Project</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Forward className="text-muted-foreground" />
                                    <span>Share Project</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDelete(item.id)
                                    }}
                                >
                                    <Trash2 className="text-muted-foreground" />
                                    <span>Delete Project</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                    {activeTeamId && (
                        <CreateProjectDialog accountId={activeTeamId}>
                            <SidebarMenuButton className="text-sidebar-foreground/70" suppressHydrationWarning>
                                <Plus className="text-sidebar-foreground/70" />
                                <span>Add Project</span>
                            </SidebarMenuButton>
                        </CreateProjectDialog>
                    )}
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    )
}
