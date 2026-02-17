'use client'

import { useTaskFilters } from '@/hooks/use-task-filters'
import type { Category } from '@/types/task'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
    categories: Category[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
    const { selectedCategories, toggleCategory } = useTaskFilters()

    // Only show visible categories
    const visibleCategories = categories.filter((c) => c.visible !== false)

    return (
        <div className="flex items-center gap-2">
            {visibleCategories.map((cat) => {
                const active = selectedCategories.includes(cat.id)
                const color = cat.color || '#71717a'
                return (
                    <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                            'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border',
                            active
                                ? 'border-current bg-current/10'
                                : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50',
                        )}
                        style={active ? { color, borderColor: `${color}40` } : undefined}
                    >
                        {cat.name}
                    </button>
                )
            })}
        </div>
    )
}
