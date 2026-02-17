'use client'

import { create } from 'zustand'

type ViewMode = 'category' | 'kanban'
export type SourceFilter = 'all' | 'local' | 'notion' | 'clickup'

interface TaskFiltersState {
    viewMode: ViewMode
    selectedCategories: string[]
    selectedPriority: string | null
    selectedSource: SourceFilter
    searchQuery: string
    setViewMode: (mode: ViewMode) => void
    toggleCategory: (categoryId: string) => void
    setPriority: (priority: string | null) => void
    setSource: (source: SourceFilter) => void
    setSearchQuery: (query: string) => void
    clearFilters: () => void
}

export const useTaskFilters = create<TaskFiltersState>((set) => ({
    viewMode: 'kanban',
    selectedCategories: [],
    selectedPriority: null,
    selectedSource: 'all',
    searchQuery: '',
    setViewMode: (mode) => set({ viewMode: mode }),
    toggleCategory: (categoryId) =>
        set((state) => ({
            selectedCategories: state.selectedCategories.includes(categoryId)
                ? state.selectedCategories.filter((c) => c !== categoryId)
                : [...state.selectedCategories, categoryId],
        })),
    setPriority: (priority) => set({ selectedPriority: priority }),
    setSource: (source) => set({ selectedSource: source }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    clearFilters: () =>
        set({ selectedCategories: [], selectedPriority: null, selectedSource: 'all', searchQuery: '' }),
}))
