'use client'

import { create } from 'zustand'

interface TaskStore {
    selectedTaskId: string | null
    setSelectedTaskId: (id: string | null) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
    selectedTaskId: null,
    setSelectedTaskId: (id) => set({ selectedTaskId: id }),
}))
