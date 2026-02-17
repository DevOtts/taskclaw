'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { updateProject, deleteProject } from '@/app/dashboard/actions'
import { toast } from "sonner"

export function ProjectSettingsForm({ project }: { project: { id: string, name: string, description?: string } }) {
    const [name, setName] = useState(project.name)
    const [description, setDescription] = useState(project.description || '')
    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const router = useRouter()



    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            await updateProject(project.id, name, description)
            toast.success('Project updated successfully')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Failed to update project')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        setDeleteLoading(true)
        try {
            const result = await deleteProject(project.id)
            if (result.error) {
                toast.error(`Error deleting project: ${result.error}`)
                setDeleteLoading(false)
            } else {
                toast.success('Project deleted successfully')
                // Wait 5 seconds before redirecting
                setTimeout(() => {
                    router.push('/dashboard')
                    router.refresh()
                }, 5000)
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred while deleting the project.')
            setDeleteLoading(false)
        }
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Project Name</CardTitle>
                    <CardDescription>
                        Used to identify your project.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate}>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Project Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2 pt-4">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Project Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                ai="enable"
                                aiPrompt="field_assistant"
                                className="min-h-[100px]"
                            />
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </CardFooter>
            </Card>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Delete Project</CardTitle>
                    <CardDescription>
                        Permanently delete this project and all of its data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This action is irreversible. Please be certain.
                    </p>
                </CardContent>
                <CardFooter className="border-t border-destructive/10 px-6 py-4 bg-destructive/5">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={deleteLoading}>
                                {deleteLoading ? 'Deleting...' : 'Delete Project'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the project
                                    "{project.name}" and remove all associated data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    )
}
