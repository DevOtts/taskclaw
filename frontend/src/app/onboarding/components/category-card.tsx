'use client'

import {
    Heart,
    Target,
    Briefcase,
    BookOpen,
    X,
    Folder,
    Star,
    Zap,
    Music,
    Palette,
    Code,
    Dumbbell,
    ShoppingCart,
    Home,
    Plane,
} from 'lucide-react'

export interface DefaultCategory {
    name: string
    color: string
    icon: string
}

const ICON_MAP: Record<string, React.ElementType> = {
    Heart,
    Target,
    Briefcase,
    BookOpen,
    Folder,
    Star,
    Zap,
    Music,
    Palette,
    Code,
    Dumbbell,
    ShoppingCart,
    Home,
    Plane,
}

interface CategoryCardProps {
    category: DefaultCategory
    selected: boolean
    onToggle: () => void
    onRemove?: () => void
    isCustom?: boolean
}

export function CategoryCard({
    category,
    selected,
    onToggle,
    onRemove,
    isCustom = false,
}: CategoryCardProps) {
    const IconComponent = ICON_MAP[category.icon] || Folder

    // Derive a tag label from the icon name
    const tagLabels: Record<string, string> = {
        Heart: 'Personal',
        Target: 'Milestones',
        Briefcase: 'Professional',
        BookOpen: 'Learning',
        Folder: 'General',
        Star: 'Favorites',
        Zap: 'Productivity',
        Music: 'Creative',
        Palette: 'Design',
        Code: 'Development',
        Dumbbell: 'Fitness',
        ShoppingCart: 'Shopping',
        Home: 'Household',
        Plane: 'Travel',
    }
    const tag = tagLabels[category.icon] || 'Custom'

    return (
        <button
            type="button"
            onClick={onToggle}
            className={`relative group text-left rounded-xl border p-4 transition-all duration-200 ${
                selected
                    ? 'border-[#FF4500]/40 bg-[#1E293B] shadow-[0_0_15px_rgba(255,69,0,0.08)]'
                    : 'border-[#334155] bg-[#1E293B]/50 opacity-60 hover:opacity-80'
            }`}
        >
            {/* Remove button */}
            {(isCustom || !selected) ? null : (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove?.()
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.stopPropagation()
                            onRemove?.()
                        }
                    }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-700/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
                >
                    <X className="w-3 h-3" />
                </div>
            )}

            {/* Icon */}
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{
                    backgroundColor: `${category.color}20`,
                }}
            >
                <IconComponent
                    className="w-5 h-5"
                    style={{ color: category.color }}
                />
            </div>

            {/* Name */}
            <h3 className="font-semibold text-sm text-slate-200 mb-1">
                {category.name}
            </h3>

            {/* Tag */}
            <div className="flex items-center gap-1.5">
                <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                />
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    {tag}
                </span>
            </div>
        </button>
    )
}
