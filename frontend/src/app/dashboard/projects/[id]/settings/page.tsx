import { getProjectDetails } from "@/app/dashboard/actions"
import { notFound } from "next/navigation"
import { ProjectSettingsForm } from "./project-settings-form"

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const project = await getProjectDetails(id)

    if (!project) {
        notFound()
    }

    return <ProjectSettingsForm project={project} />
}
