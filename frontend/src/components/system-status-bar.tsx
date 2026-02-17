'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Loader2, Wifi, WifiOff } from 'lucide-react'
import { getSyncStatus, triggerSync } from '@/app/dashboard/settings/integrations/actions'
import { getAiProviderConfig, verifyAiProviderConnection } from '@/app/dashboard/settings/ai-provider/actions'

interface SourceStatus {
    id: string
    provider: string
    sync_status: string
    last_synced_at: string | null
    last_sync_error: string | null
}

function timeAgo(dateStr: string): string {
    const now = Date.now()
    const date = new Date(dateStr).getTime()
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export function SystemStatusBar() {
    const [sources, setSources] = useState<SourceStatus[]>([])
    const [aiStatus, setAiStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')
    const [syncing, setSyncing] = useState(false)
    const [pinging, setPinging] = useState(false)

    const fetchSyncStatus = useCallback(async () => {
        const result = await getSyncStatus()
        if (Array.isArray(result)) {
            setSources(result)
        }
    }, [])

    const checkAiHealth = useCallback(async () => {
        const config = await getAiProviderConfig()
        if (!config?.api_url) {
            setAiStatus('disconnected')
            return
        }
        setPinging(true)
        try {
            const result = await verifyAiProviderConnection({
                api_url: config.api_url,
                api_key: config.api_key,
                agent_id: config.agent_id,
            })
            setAiStatus(result?.success ? 'connected' : 'disconnected')
        } catch {
            setAiStatus('disconnected')
        } finally {
            setPinging(false)
        }
    }, [])

    // Initial load + poll every 30s
    useEffect(() => {
        fetchSyncStatus()
        checkAiHealth()

        const interval = setInterval(fetchSyncStatus, 30000)
        return () => clearInterval(interval)
    }, [fetchSyncStatus, checkAiHealth])

    const handleSyncAll = async () => {
        if (syncing) return
        setSyncing(true)
        try {
            for (const source of sources) {
                await triggerSync(source.id)
            }
            await fetchSyncStatus()
        } finally {
            setSyncing(false)
        }
    }

    const handlePingAi = () => {
        if (pinging) return
        checkAiHealth()
    }

    const statusDotColor = (status: string) => {
        switch (status) {
            case 'idle':
                return 'bg-emerald-500'
            case 'syncing':
                return 'bg-yellow-500 animate-pulse'
            case 'error':
                return 'bg-red-500'
            case 'disabled':
                return 'bg-zinc-600'
            default:
                return 'bg-zinc-600'
        }
    }

    const aiDotColor =
        aiStatus === 'connected'
            ? 'bg-emerald-500'
            : aiStatus === 'disconnected'
              ? 'bg-red-500'
              : 'bg-zinc-600'

    return (
        <footer className="relative z-20 h-10 border-t border-border flex items-center justify-between px-6 bg-background/50 text-[10px] text-muted-foreground font-medium shrink-0">
            <div className="flex gap-5 items-center">
                {/* Source sync statuses */}
                {sources.map((source) => (
                    <div key={source.id} className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(source.sync_status)}`} />
                        <span className="capitalize">{source.provider}</span>
                        {source.last_synced_at && (
                            <span className="text-muted-foreground/60">
                                {timeAgo(source.last_synced_at)}
                            </span>
                        )}
                        {source.sync_status === 'error' && source.last_sync_error && (
                            <span className="text-red-400 max-w-[120px] truncate" title={source.last_sync_error}>
                                {source.last_sync_error}
                            </span>
                        )}
                    </div>
                ))}

                {sources.length === 0 && (
                    <span className="text-muted-foreground/50">No sources</span>
                )}

                {/* Refresh button */}
                {sources.length > 0 && (
                    <button
                        onClick={handleSyncAll}
                        disabled={syncing}
                        className="hover:text-foreground transition-colors disabled:opacity-50"
                        title="Sync all sources"
                    >
                        {syncing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3 h-3" />
                        )}
                    </button>
                )}
            </div>

            <div className="flex gap-4 items-center">
                {/* AI health */}
                <button
                    onClick={handlePingAi}
                    disabled={pinging}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors disabled:opacity-50"
                    title={aiStatus === 'connected' ? 'AI Connected' : 'AI Disconnected — Click to retry'}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${aiDotColor}`} />
                    {pinging ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : aiStatus === 'connected' ? (
                        <Wifi className="w-3 h-3" />
                    ) : (
                        <WifiOff className="w-3 h-3" />
                    )}
                    <span>{aiStatus === 'connected' ? 'AI Connected' : aiStatus === 'disconnected' ? 'AI Offline' : 'AI...'}</span>
                </button>
            </div>
        </footer>
    )
}
