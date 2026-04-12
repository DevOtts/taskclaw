'use client'

import { Target, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { useTaskStore } from '@/hooks/use-task-store'
import { cn } from '@/lib/utils'

export interface ToolEntity {
    type: 'dag' | 'task'
    id: string
    title?: string
    goal?: string
    status?: string
    pod_id?: string
    board_id?: string
    priority?: string
}

function GoalCard({ entity, podSlug }: { entity: ToolEntity; podSlug?: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        pending_approval: {
            label: 'Pending approval',
            className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
        },
        pending: {
            label: 'Pending',
            className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
        },
        running: {
            label: 'Running',
            className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
        },
        completed: {
            label: 'Completed',
            className: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20',
        },
        failed: {
            label: 'Failed',
            className: 'bg-destructive/15 text-destructive',
        },
        cancelled: {
            label: 'Cancelled',
            className: 'bg-muted text-muted-foreground',
        },
    }

    const status = entity.status ? statusConfig[entity.status] : null

    return (
        <div className="flex items-center gap-2 bg-accent/20 border border-border rounded-lg px-3 py-2">
            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium truncate flex-1 min-w-0">
                {entity.goal || 'Goal'}
            </span>
            {status && (
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 shrink-0', status.className)}>
                    {status.label}
                </Badge>
            )}
            {podSlug ? (
                <Link
                    href={`/dashboard/pods/${podSlug}?tab=goals`}
                    className="text-[10px] text-primary hover:underline shrink-0"
                >
                    View Goals
                </Link>
            ) : (
                <span className="text-[10px] text-muted-foreground shrink-0">Goal</span>
            )}
        </div>
    )
}

function TaskCard({ entity }: { entity: ToolEntity }) {
    const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId)

    const priorityColor = (p?: string) => {
        switch (p?.toLowerCase()) {
            case 'high': return 'text-red-400'
            case 'low': return 'text-blue-400'
            default: return 'text-amber-400'
        }
    }

    return (
        <div className="flex items-center gap-2 bg-accent/20 border border-border rounded-lg px-3 py-2">
            <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium truncate flex-1 min-w-0">
                {entity.title || 'Task'}
            </span>
            {entity.priority && (
                <span className={cn('text-[10px] font-medium shrink-0', priorityColor(entity.priority))}>
                    {entity.priority}
                </span>
            )}
            <button
                onClick={() => setSelectedTaskId(entity.id)}
                className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors shrink-0"
            >
                Open
            </button>
        </div>
    )
}

export function EntityCards({ entities, podSlug }: { entities: ToolEntity[]; podSlug?: string }) {
    if (!entities || entities.length === 0) return null

    return (
        <div className="ml-2 space-y-1.5 mt-1">
            {entities.map((entity) => (
                entity.type === 'dag'
                    ? <GoalCard key={entity.id} entity={entity} podSlug={podSlug} />
                    : <TaskCard key={entity.id} entity={entity} />
            ))}
        </div>
    )
}
