'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getPods,
    getPodBySlug,
    createPod,
    updatePod,
    deletePod,
    getPodBoards,
    assignBoardToPod,
    removeFromPod,
    getAllBoards,
} from '@/app/dashboard/pods/actions'
import type { CreatePodPayload, UpdatePodPayload } from '@/types/pod'
import { getSidebarCache, setSidebarCache, clearSidebarCache } from '@/lib/sidebar-cache'
import type { Pod } from '@/types/pod'

function getActiveAccountId(): string {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(/(?:^|;\s*)current_account_id=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : ''
}

export function usePods() {
    const accountId = getActiveAccountId()
    const cached = getSidebarCache<Pod[]>('pods', accountId)

    return useQuery({
        queryKey: ['pods'],
        queryFn: async () => {
            const data = await getPods()
            if (accountId && data) {
                setSidebarCache('pods', accountId, data)
            }
            return data
        },
        staleTime: 30000,
        refetchInterval: 60000,
        initialData: cached?.data,
        initialDataUpdatedAt: cached?.updatedAt,
    })
}

export function usePod(slug: string) {
    return useQuery({
        queryKey: ['pods', slug],
        queryFn: () => getPodBySlug(slug),
        enabled: !!slug,
        staleTime: 30000,
    })
}

export function usePodBoards(podId: string | null) {
    return useQuery({
        queryKey: ['podBoards', podId],
        queryFn: () => getPodBoards(podId!),
        enabled: !!podId,
        staleTime: 30000,
    })
}

export function useCreatePod() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreatePodPayload) => createPod(payload),
        onSuccess: () => {
            clearSidebarCache('pods', getActiveAccountId())
            qc.invalidateQueries({ queryKey: ['pods'] })
        },
    })
}

export function useUpdatePod() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ podId, payload }: { podId: string; payload: UpdatePodPayload }) =>
            updatePod(podId, payload),
        onSuccess: () => {
            clearSidebarCache('pods', getActiveAccountId())
            qc.invalidateQueries({ queryKey: ['pods'] })
        },
    })
}

export function useDeletePod() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deletePod,
        onSuccess: () => {
            clearSidebarCache('pods', getActiveAccountId())
            qc.invalidateQueries({ queryKey: ['pods'] })
        },
    })
}

export function useAssignBoardToPod() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ boardId, podId }: { boardId: string; podId: string }) =>
            assignBoardToPod(boardId, podId),
        onSuccess: () => {
            const accountId = getActiveAccountId()
            clearSidebarCache('boards', accountId)
            clearSidebarCache('pods', accountId)
            qc.invalidateQueries({ queryKey: ['podBoards'] })
            qc.invalidateQueries({ queryKey: ['boards'] })
        },
    })
}

export function useRemoveFromPod() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (boardId: string) => removeFromPod(boardId),
        onSuccess: () => {
            const accountId = getActiveAccountId()
            clearSidebarCache('boards', accountId)
            clearSidebarCache('pods', accountId)
            qc.invalidateQueries({ queryKey: ['podBoards'] })
            qc.invalidateQueries({ queryKey: ['boards'] })
        },
    })
}

export function useAllBoards() {
    return useQuery({
        queryKey: ['boards', 'all'],
        queryFn: getAllBoards,
        staleTime: 30000,
    })
}
