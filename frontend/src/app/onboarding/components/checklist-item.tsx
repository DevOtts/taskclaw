'use client'

import { Check, Circle } from 'lucide-react'

export type ChecklistStatus = 'completed' | 'required' | 'optional' | 'pending'

interface ChecklistItemProps {
    icon: React.ReactNode
    label: string
    description: string
    status: ChecklistStatus
    badge?: string
    badgeVariant?: 'completed' | 'required' | 'info'
    actionLabel?: string
    onAction?: () => void
    isActive?: boolean
}

export function ChecklistItem({
    icon,
    label,
    description,
    status,
    badge,
    badgeVariant = 'info',
    actionLabel,
    onAction,
    isActive = false,
}: ChecklistItemProps) {
    const isCompleted = status === 'completed'
    const isClickable = !!onAction

    return (
        <div
            onClick={isClickable ? onAction : undefined}
            className={`relative rounded-xl border p-4 transition-all ${
                isClickable ? 'cursor-pointer' : ''
            } ${
                isActive
                    ? 'border-[#FF4500] bg-[#FF4500]/5 shadow-[0_0_20px_rgba(255,69,0,0.1)]'
                    : isCompleted
                    ? 'border-[#334155] bg-[#1E293B]/50 opacity-70'
                    : 'border-[#334155] bg-[#1E293B] hover:border-slate-600'
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-[#00FF94]/10 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-[#00FF94]" />
                        </div>
                    ) : isActive ? (
                        <div className="relative w-6 h-6 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-[#FF4500]/20 animate-ping" />
                            <div className="w-3 h-3 rounded-full bg-[#FF4500]" />
                        </div>
                    ) : (
                        <Circle className="w-6 h-6 text-slate-600" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span
                            className={`font-medium text-sm ${
                                isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'
                            }`}
                        >
                            {label}
                        </span>
                        {badge && (
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    badgeVariant === 'completed'
                                        ? 'bg-[#00FF94]/10 text-[#00FF94]'
                                        : badgeVariant === 'required'
                                        ? 'bg-[#FF4500]/10 text-[#FF4500]'
                                        : 'bg-slate-700 text-slate-400'
                                }`}
                            >
                                {badge}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Action button */}
                {actionLabel && onAction && !isCompleted && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onAction()
                        }}
                        className={`shrink-0 px-4 h-8 rounded-lg text-xs font-bold transition-all ${
                            isActive
                                ? 'bg-[#FF4500] text-black hover:bg-[#E63E00]'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {actionLabel}
                    </button>
                )}

                {/* Completed settings icon */}
                {isCompleted && (
                    <div className="shrink-0 text-slate-600">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}
