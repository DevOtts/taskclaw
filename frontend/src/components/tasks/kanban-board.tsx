'use client'

import { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import type { Task, TaskStatus, Category } from '@/types/task'
import { KANBAN_COLUMNS } from '@/types/task'
import { useMoveTask } from '@/hooks/use-tasks'
import { KanbanColumn } from './kanban-column'
import { TaskCard } from './task-card'
import { NewTaskDialog } from './new-task-dialog'

interface KanbanBoardProps {
    tasks: Task[]
    categories: Category[]
}

export function KanbanBoard({ tasks, categories }: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null)
    const [showNewTask, setShowNewTask] = useState<TaskStatus | null>(null)
    const moveTask = useMoveTask()

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    )

    const getTasksByStatus = (status: TaskStatus) =>
        tasks.filter((t) => {
            const taskStatus = t.status || 'To-Do'
            return taskStatus === status
        })

    function handleDragStart(event: DragStartEvent) {
        const task = tasks.find((t) => t.id === event.active.id)
        if (task) setActiveTask(task)
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveTask(null)
        const { active, over } = event
        if (!over) return

        const taskId = active.id as string
        const overId = over.id as string

        // Check if dropped on a column
        const targetStatus = KANBAN_COLUMNS.includes(overId as TaskStatus)
            ? (overId as TaskStatus)
            : (tasks.find((t) => t.id === overId)?.status || 'To-Do') as TaskStatus | undefined

        if (!targetStatus) return

        const task = tasks.find((t) => t.id === taskId)
        if (task && (task.status || 'To-Do') !== targetStatus) {
            moveTask.mutate({ id: taskId, status: targetStatus })
        }
    }

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 flex-1 h-full min-w-max">
                    {KANBAN_COLUMNS.map((status) => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            tasks={getTasksByStatus(status)}
                            categories={categories}
                            onAddTask={() => setShowNewTask(status)}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask && <TaskCard task={activeTask} categories={categories} />}
                </DragOverlay>
            </DndContext>

            {showNewTask && (
                <NewTaskDialog
                    defaultStatus={showNewTask}
                    categories={categories}
                    onClose={() => setShowNewTask(null)}
                />
            )}
        </>
    )
}
