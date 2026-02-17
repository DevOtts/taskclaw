'use server'

import { getAuthToken, isTokenExpired } from '@/lib/auth'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getAuthHeaders() {
    const token = await getAuthToken()
    if (!token || isTokenExpired(token)) return null
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    }
}

async function getCurrentAccountId() {
    const cookieStore = await cookies()
    const accountId = cookieStore.get('current_account_id')?.value
    
    console.log('[getCurrentAccountId] Cookie value:', accountId)
    console.log('[getCurrentAccountId] All cookies:', 
        Array.from(cookieStore.getAll()).map(c => c.name).join(', '))
    
    return accountId
}

export async function getConversations() {
    const headers = await getAuthHeaders()
    const accountId = await getCurrentAccountId()
    
    if (!headers || !accountId) return { data: [] }

    try {
        const res = await fetch(`${API_URL}/accounts/${accountId}/conversations`, {
            headers,
            cache: 'no-store',
        })
        
        if (!res.ok) return { data: [] }
        return await res.json()
    } catch (error) {
        console.error('Failed to load conversations:', error)
        return { data: [] }
    }
}

export async function getMessages(conversationId: string) {
    const headers = await getAuthHeaders()
    const accountId = await getCurrentAccountId()
    
    if (!headers || !accountId) return { data: [] }

    try {
        const res = await fetch(
            `${API_URL}/accounts/${accountId}/conversations/${conversationId}/messages`,
            {
                headers,
                cache: 'no-store',
            }
        )
        
        if (!res.ok) return { data: [] }
        return await res.json()
    } catch (error) {
        console.error('Failed to load messages:', error)
        return { data: [] }
    }
}

export async function getSkills() {
    try {
        const accountId = await getCurrentAccountId();
        const headers = await getAuthHeaders();
        if (!headers || !accountId) {
            throw new Error('Not authenticated');
        }

        const res = await fetch(`${API_URL}/accounts/${accountId}/skills?active_only=true`, {
            headers,
            cache: 'no-store',
        });

        if (!res.ok) {
            throw new Error('Failed to fetch skills');
        }

        return await res.json();
    } catch (error) {
        console.error('[getSkills] Error:', error);
        return [];
    }
}

export async function createConversation(title?: string, taskId?: string, skillIds?: string[]) {
    const headers = await getAuthHeaders()
    const accountId = await getCurrentAccountId()
    
    console.log('[createConversation] Debug:', { 
        hasHeaders: !!headers, 
        accountId,
        timestamp: new Date().toISOString()
    })
    
    if (!headers || !accountId) {
        console.error('[createConversation] Missing auth:', { headers: !!headers, accountId })
        return { error: 'Not authenticated' }
    }

    try {
        const url = `${API_URL}/accounts/${accountId}/conversations`
        console.log('[createConversation] Calling API:', url)
        
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: title || 'New Conversation',
                task_id: taskId,
                skill_ids: skillIds || [],
            }),
        })
        
        console.log('[createConversation] Response status:', res.status)
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
            console.error('[createConversation] API error:', errorData)
            return { error: errorData.message || 'Failed to create conversation' }
        }
        
        const data = await res.json()
        console.log('[createConversation] Success:', data.id)
        return data
    } catch (error: any) {
        console.error('[createConversation] Exception:', error)
        return { error: error.message || 'Network error' }
    }
}

export async function sendMessage(conversationId: string, content: string) {
    const headers = await getAuthHeaders()
    const accountId = await getCurrentAccountId()
    
    if (!headers || !accountId) {
        return { error: 'Not authenticated' }
    }

    try {
        const res = await fetch(
            `${API_URL}/accounts/${accountId}/conversations/${conversationId}/messages`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({ content }),
            }
        )
        
        if (!res.ok) {
            const error = await res.json()
            return { error: error.message || 'Failed to send message' }
        }
        
        return await res.json()
    } catch (error: any) {
        return { error: error.message || 'Network error' }
    }
}

export async function sendMessageBackground(conversationId: string, content: string) {
    const headers = await getAuthHeaders()
    const accountId = await getCurrentAccountId()

    if (!headers || !accountId) {
        return { error: 'Not authenticated' }
    }

    try {
        const res = await fetch(
            `${API_URL}/accounts/${accountId}/conversations/${conversationId}/messages/background`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({ content }),
            }
        )

        if (!res.ok) {
            const error = await res.json()
            return { error: error.message || 'Failed to send message' }
        }

        return await res.json()
    } catch (error: any) {
        return { error: error.message || 'Network error' }
    }
}

export async function deleteConversation(conversationId: string) {
    const headers = await getAuthHeaders()
    const accountId = await getCurrentAccountId()
    
    if (!headers || !accountId) {
        return { error: 'Not authenticated' }
    }

    try {
        const res = await fetch(
            `${API_URL}/accounts/${accountId}/conversations/${conversationId}`,
            {
                method: 'DELETE',
                headers,
            }
        )
        
        if (!res.ok) {
            return { error: 'Failed to delete conversation' }
        }
        
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Network error' }
    }
}

/**
 * Sprint 7: Save AI findings to a task and trigger outbound sync to Notion/ClickUp
 */
export async function saveAiToTask(
    taskId: string,
    content: string,
    conversationId?: string,
) {
    const headers = await getAuthHeaders()
    const accountId = await getCurrentAccountId()

    if (!headers || !accountId) {
        return { error: 'Not authenticated' }
    }

    try {
        const res = await fetch(
            `${API_URL}/accounts/${accountId}/tasks/${taskId}/ai-update`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    notes_append: content,
                    conversation_id: conversationId,
                }),
            }
        )

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Unknown error' }))
            return { error: error.message || 'Failed to save to task' }
        }

        return await res.json()
    } catch (error: any) {
        return { error: error.message || 'Network error' }
    }
}

export async function updateConversationTitle(conversationId: string, title: string) {
    const headers = await getAuthHeaders()
    const accountId = await getCurrentAccountId()
    
    if (!headers || !accountId) {
        return { error: 'Not authenticated' }
    }

    try {
        const res = await fetch(
            `${API_URL}/accounts/${accountId}/conversations/${conversationId}`,
            {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ title }),
            }
        )
        
        if (!res.ok) {
            return { error: 'Failed to update conversation' }
        }
        
        return await res.json()
    } catch (error: any) {
        return { error: error.message || 'Network error' }
    }
}
