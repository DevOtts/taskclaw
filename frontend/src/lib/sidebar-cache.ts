/**
 * Persistent localStorage cache for sidebar data (boards + pods).
 * Keyed by account ID so switching accounts gets fresh data.
 * TTL: 10 minutes — stale data is shown instantly, background refetch updates it.
 */

const TTL_MS = 10 * 60 * 1000 // 10 minutes

interface CacheEntry<T> {
    data: T
    expiresAt: number
    updatedAt: number
}

export interface CacheResult<T> {
    data: T
    updatedAt: number
}

function makeKey(type: 'boards' | 'pods', accountId: string): string {
    return `tc:sidebar:${type}:${accountId}`
}

export function getSidebarCache<T>(type: 'boards' | 'pods', accountId: string): CacheResult<T> | undefined {
    if (typeof window === 'undefined') return undefined
    try {
        const raw = localStorage.getItem(makeKey(type, accountId))
        if (!raw) return undefined
        const entry: CacheEntry<T> = JSON.parse(raw)
        if (Date.now() > entry.expiresAt) {
            localStorage.removeItem(makeKey(type, accountId))
            return undefined
        }
        return { data: entry.data, updatedAt: entry.updatedAt }
    } catch {
        return undefined
    }
}

export function setSidebarCache<T>(type: 'boards' | 'pods', accountId: string, data: T): void {
    if (typeof window === 'undefined') return
    try {
        const now = Date.now()
        const entry: CacheEntry<T> = { data, expiresAt: now + TTL_MS, updatedAt: now }
        localStorage.setItem(makeKey(type, accountId), JSON.stringify(entry))
    } catch {
        // localStorage full or unavailable — silently skip
    }
}

export function clearSidebarCache(type: 'boards' | 'pods', accountId: string): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.removeItem(makeKey(type, accountId))
    } catch {
        // ignore
    }
}

export function clearAllSidebarCaches(accountId: string): void {
    clearSidebarCache('boards', accountId)
    clearSidebarCache('pods', accountId)
}
