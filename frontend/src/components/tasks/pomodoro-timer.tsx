'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import { usePomodoro } from '@/hooks/use-pomodoro'

export function PomodoroTimer() {
    const { formattedTime, isRunning, mode, activeTaskTitle, toggleTimer, reset } =
        usePomodoro()

    return (
        <div className="flex items-center gap-3 bg-accent/50 border border-orange-500/20 px-4 py-2 rounded-xl">
            <div className="text-right">
                <div className="text-lg font-bold text-orange-400 tabular-nums font-mono leading-none">
                    {formattedTime}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {mode === 'focus' ? 'Pomodoro Focus' : mode === 'break' ? 'Short Break' : 'Long Break'}
                </div>
                {activeTaskTitle && (
                    <div className="text-[8px] text-orange-400/60 truncate max-w-[120px]">
                        {activeTaskTitle}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={toggleTimer}
                    className="w-8 h-8 rounded-lg bg-orange-400/20 text-orange-400 flex items-center justify-center hover:bg-orange-400/30 transition-all"
                >
                    {isRunning ? (
                        <Pause className="w-4 h-4" />
                    ) : (
                        <Play className="w-4 h-4" />
                    )}
                </button>
                <button
                    onClick={reset}
                    className="w-6 h-6 rounded-md text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors"
                >
                    <RotateCcw className="w-3 h-3" />
                </button>
            </div>
        </div>
    )
}
