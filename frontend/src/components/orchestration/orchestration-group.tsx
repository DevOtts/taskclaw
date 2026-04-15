'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronRight, Loader2, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useTaskStore } from '@/hooks/use-task-store'
import type { ActiveOrchestration } from '@/hooks/use-live-execution'

interface OrchTask {
    id: string
    goal: string
    status: string
    pod_name?: string
    task_id?: string
    depends_on_titles?: string[]
}

interface OrchDetail {
    id: string
    goal: string
    status: string
    tasks: OrchTask[]
    pods?: { name?: string; slug?: string }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

const STATUS_ICON: Record<string, React.ReactNode> = {
    pending_approval: <Clock className="w-3 h-3 text-yellow-400" />,
    pending: <Clock className="w-3 h-3 text-slate-400" />,
    running: <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />,
    completed: <CheckCircle2 className="w-3 h-3 text-green-400" />,
    failed: <XCircle className="w-3 h-3 text-red-400" />,
    cancelled: <XCircle className="w-3 h-3 text-slate-500" />,
}

const STATUS_LABEL: Record<string, string> = {
    pending_approval: 'Needs approval',
    pending: 'Queued',
    running: 'Running',
    completed: 'Done',
    failed: 'Failed',
    cancelled: 'Cancelled',
}

function extractToken(): string | null {
    if (typeof document === 'undefined') return null
    try {
        const cookies = document.cookie.split('; ')
        const parts: Record<string, string> = {}
        for (const c of cookies) {
            const eq = c.indexOf('=')
            const name = c.substring(0, eq)
            const val = c.substring(eq + 1)
            if (name.includes('auth-token')) parts[name] = val
        }
        const sorted = Object.entries(parts).sort(([a], [b]) => a.localeCompare(b))
        const joined = sorted.map(([, v]) => v).join('')
        if (!joined) return null
        const raw = joined.startsWith('base64-') ? joined.slice(7) : joined
        return JSON.parse(atob(raw))?.access_token ?? null
    } catch { return null }
}

interface OrchestrationGroupProps {
    orchestration: ActiveOrchestration
    liveStatus?: string
    accountId: string
}

export function OrchestrationGroup({ orchestration, liveStatus, accountId }: OrchestrationGroupProps) {
    const [expanded, setExpanded] = useState(false)
    const [detail, setDetail] = useState<OrchDetail | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId)

    const status = liveStatus ?? orchestration.status
    const podName = detail?.pods?.name ?? orchestration.pod_name ?? orchestration.pod_slug ?? 'Pod'
    const podSlug = detail?.pods?.slug ?? orchestration.pod_slug
    const tasks = detail?.tasks ?? []

    const fetchDetail = useCallback(async () => {
        if (loadingDetail) return
        setLoadingDetail(true)
        try {
            const token = extractToken()
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(
                `${API_URL}/accounts/${accountId}/orchestrations/${orchestration.id}`,
                { headers }
            )
            if (!res.ok) return
            const data: OrchDetail = await res.json()
            setDetail(data)
        } catch { /* silent */ }
        finally { setLoadingDetail(false) }
    }, [accountId, orchestration.id, loadingDetail])

    // Fetch detail when expanded
    useEffect(() => {
        if (expanded && !detail) {
            fetchDetail()
        }
    }, [expanded, detail, fetchDetail])

    return (
        <div className={cn(
            'rounded-xl border overflow-hidden transition-all',
            status === 'pending_approval' && 'border-yellow-500/30 bg-yellow-500/5',
            status === 'running' && 'border-blue-500/20 bg-blue-500/5',
            status === 'completed' && 'border-green-500/20 bg-green-500/5',
            status === 'failed' && 'border-red-500/20 bg-red-500/5',
            (status === 'cancelled' || status === 'pending') && 'border-white/10 bg-white/[0.02]',
        )}>
            {/* Header */}
            <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
            >
                <div className="mt-0.5 shrink-0">
                    {STATUS_ICON[status] ?? STATUS_ICON.pending}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                            {podName}
                        </span>
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                                background: status === 'pending_approval' ? 'rgba(255,209,111,0.15)' :
                                    status === 'running' ? 'rgba(96,165,250,0.15)' :
                                    status === 'completed' ? 'rgba(74,222,128,0.15)' :
                                    status === 'failed' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.08)',
                                color: status === 'pending_approval' ? '#fcd34d' :
                                    status === 'running' ? '#60a5fa' :
                                    status === 'completed' ? '#4ade80' :
                                    status === 'failed' ? '#f87171' : 'rgba(255,255,255,0.4)',
                            }}>
                            {STATUS_LABEL[status] ?? status}
                        </span>
                    </div>
                    <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {orchestration.goal}
                    </p>
                </div>
                <div className="shrink-0 mt-0.5">
                    {expanded
                        ? <ChevronDown className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                        : <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    }
                </div>
            </button>

            {/* Expanded task list */}
            {expanded && (
                <div className="border-t divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {loadingDetail && tasks.length === 0 && (
                        <div className="px-3 py-3 text-center">
                            <Loader2 className="w-3 h-3 animate-spin mx-auto" style={{ color: 'rgba(255,255,255,0.3)' }} />
                        </div>
                    )}
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="px-3 py-2 flex items-start gap-2 group hover:bg-white/[0.03] transition-colors"
                        >
                            <div className="mt-0.5 shrink-0">
                                {STATUS_ICON[task.status] ?? STATUS_ICON.pending}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                    {task.goal}
                                </p>
                                {task.pod_name && (
                                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                        {task.pod_name}
                                    </span>
                                )}
                                {task.depends_on_titles && task.depends_on_titles.length > 0 && (
                                    <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                        after: {task.depends_on_titles.join(', ')}
                                    </p>
                                )}
                            </div>
                            {/* If there's a linked task_id, show open button */}
                            {task.task_id && (
                                <button
                                    onClick={() => setSelectedTaskId(task.task_id!)}
                                    className="opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 rounded shrink-0 transition-opacity"
                                    style={{ background: 'rgba(143,245,255,0.1)', color: 'rgba(143,245,255,0.7)' }}
                                >
                                    Open
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Footer: view in pod */}
                    {podSlug && (
                        <div className="px-3 py-2">
                            <Link href={`/dashboard/pods/${podSlug}?tab=goals`}
                                className="flex items-center gap-1.5 text-[10px] hover:underline"
                                style={{ color: 'rgba(143,245,255,0.5)' }}>
                                <ExternalLink className="w-3 h-3" />
                                View in {podName}
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
