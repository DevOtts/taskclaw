'use client'

import { useDroppable } from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, MoreHorizontal } from 'lucide-react'
import type { Task, Category } from '@/types/task'
import type { BoardStep } from '@/types/board'
import { TaskCard } from '@/components/tasks/task-card'
import { cn } from '@/lib/utils'

interface BoardKanbanColumnProps {
    step: BoardStep
    tasks: Task[]
    categories?: Category[]
    onAddTask?: () => void
}

export function BoardKanbanColumn({
    step,
    tasks,
    categories = [],
    onAddTask,
}: BoardKanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: step.id })
    const color = step.color || '#71717a'

    return (
        <div className="w-72 flex flex-col flex-shrink-0 min-h-0">
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                        {step.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                        {tasks.length}
                    </span>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={cn(
                    'flex flex-col gap-2.5 flex-1 min-h-0 p-1 rounded-lg transition-colors overflow-y-auto',
                    isOver && 'bg-primary/5 ring-1 ring-primary/20',
                )}
            >
                <SortableContext
                    items={tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            isDone={step.step_type === 'done'}
                            categories={categories}
                        />
                    ))}
                </SortableContext>

                {/* Add Task button */}
                {step.step_type !== 'done' && (
                    <button
                        onClick={onAddTask}
                        className="border border-dashed border-border p-2.5 rounded-lg text-muted-foreground text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Task
                    </button>
                )}
            </div>
        </div>
    )
}
