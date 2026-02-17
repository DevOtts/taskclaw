'use client'

import { useTaskFilters, type SourceFilter as SourceFilterType } from '@/hooks/use-task-filters'
import { Link2Off } from 'lucide-react'
import { cn } from '@/lib/utils'

const SOURCE_OPTIONS: { value: SourceFilterType; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: '#71717a' },
    { value: 'notion', label: 'Notion', color: '#ffffff' },
    { value: 'clickup', label: 'ClickUp', color: '#7b68ee' },
    { value: 'local', label: 'Local', color: '#71717a' },
]

export function SourceFilter() {
    const { selectedSource, setSource } = useTaskFilters()

    return (
        <div className="flex items-center gap-1.5">
            {SOURCE_OPTIONS.map((opt) => {
                const active = selectedSource === opt.value
                return (
                    <button
                        key={opt.value}
                        onClick={() => setSource(active && opt.value !== 'all' ? 'all' : opt.value)}
                        className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5',
                            active
                                ? 'border-current bg-current/10'
                                : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50',
                        )}
                        style={active ? { color: opt.color, borderColor: `${opt.color}40` } : undefined}
                    >
                        {opt.value === 'notion' && (
                            <svg viewBox="0 0 100 100" className="w-2.5 h-2.5" fill="currentColor">
                                <path d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.39-8.16-3.113L3.3 79.94c-2.333-3.113-3.3-5.443-3.3-8.167V11.113c0-3.497 1.553-6.413 6.017-6.8z"/>
                            </svg>
                        )}
                        {opt.value === 'clickup' && (
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="currentColor">
                                <path d="M4.105 18.214l3.143-2.406c1.87 2.446 4.05 3.592 6.752 3.592 2.717 0 4.904-1.136 6.763-3.552l3.113 2.448C21.302 21.596 18.33 23.4 14 23.4c-4.345 0-7.327-1.822-9.895-5.186z"/>
                                <path d="M7.09 12.06l3.143-2.406L14 13.042l3.767-3.388 3.113 2.448L14 18.6 7.09 12.06z"/>
                            </svg>
                        )}
                        {opt.value === 'local' && <Link2Off className="w-2.5 h-2.5" />}
                        {opt.label}
                    </button>
                )
            })}
        </div>
    )
}
