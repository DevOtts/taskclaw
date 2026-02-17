'use client'

import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'
import { DataViewLayout } from '@/components/data-view-layout'
import { CreateProjectDialog } from '@/components/create-project-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function DashboardProjectsView({
  projects,
  activeAccountId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects: any[]
  activeAccountId: string
}) {
  const noProjectsState = (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[400px]">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">No projects</h3>
        <p className="text-sm text-muted-foreground">You haven&apos;t created any projects yet.</p>
        <div className="mt-4">
          <CreateProjectDialog accountId={activeAccountId}>
            <Button>Create Project</Button>
          </CreateProjectDialog>
        </div>
      </div>
    </div>
  )

  return (
    <DataViewLayout
      title="Projects"
      description="Manage your projects."
      itemName="projects"
      items={projects}
      actions={
        <CreateProjectDialog accountId={activeAccountId}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </CreateProjectDialog>
      }
      emptyState={noProjectsState}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderGridItem={(project: any) => (
        <Link href={`/dashboard/projects/${project.id}`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>Created {new Date(project.created_at).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md bg-muted" />
            </CardContent>
          </Card>
        </Link>
      )}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderTable={(items: any[]) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/projects/${project.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    />
  )
}


