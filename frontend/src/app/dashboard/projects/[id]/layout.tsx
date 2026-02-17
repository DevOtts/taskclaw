import { getProjectDetails } from "@/app/dashboard/actions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const project = await getProjectDetails(id)

    if (!project) {
        notFound()
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground">
                        Manage your project settings and view analytics.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4 border-b pb-2">
                <Link href={`/dashboard/projects/${id}`}>
                    <Button variant="ghost" size="sm">
                        Overview
                    </Button>
                </Link>
                <Link href={`/dashboard/projects/${id}/settings`}>
                    <Button variant="ghost" size="sm">
                        Settings
                    </Button>
                </Link>
            </div>
            {children}
        </div>
    )
}
