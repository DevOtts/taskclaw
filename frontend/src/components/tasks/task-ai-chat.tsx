'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, X, Loader2, FileDown, CheckCircle, ExternalLink, BrainCircuit } from 'lucide-react'
import { createConversation, sendMessageBackground, getMessages, saveAiToTask } from '@/app/dashboard/chat/actions'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface Message {
    id?: string
    role: 'user' | 'assistant' | 'system'
    content: string
    created_at?: string
    metadata?: Record<string, any>
}

interface TaskAIChatProps {
    taskId: string
    taskTitle: string
    sourceProvider?: string | null // 'notion' | 'clickup' | null
    onClose: () => void
}

export function TaskAIChat({ taskId, taskTitle, sourceProvider, onClose }: TaskAIChatProps) {
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isInitializing, setIsInitializing] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [savingMessageId, setSavingMessageId] = useState<string | null>(null)
    const [savedMessages, setSavedMessages] = useState<Set<string>>(new Set())
    const [syncFeedback, setSyncFeedback] = useState<Record<string, string>>({})
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const queryClient = useQueryClient()

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, isProcessing, scrollToBottom])

    // Load messages and check if AI is still processing
    const loadMessages = useCallback(async (convId: string) => {
        const result = await getMessages(convId)
        if (result?.data && Array.isArray(result.data)) {
            const msgs: Message[] = result.data.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                created_at: m.created_at,
                metadata: m.metadata,
            }))
            setMessages(msgs)

            // Check if the last message is from user (AI still processing)
            const lastMsg = msgs[msgs.length - 1]
            if (lastMsg && lastMsg.role === 'user') {
                setIsProcessing(true)
            } else {
                setIsProcessing(false)
                // AI has responded — stop polling and refresh tasks to update Kanban
                stopPolling()
                queryClient.invalidateQueries({ queryKey: ['tasks'] })
            }
        }
    }, [queryClient])

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current)
            pollTimerRef.current = null
        }
    }, [])

    // Start polling for new messages (every 5s)
    const startPolling = useCallback((convId: string) => {
        stopPolling()
        pollTimerRef.current = setInterval(() => {
            loadMessages(convId)
        }, 5000)
    }, [stopPolling, loadMessages])

    // Cleanup polling on unmount
    useEffect(() => {
        return () => stopPolling()
    }, [stopPolling])

    // Initialize conversation on mount
    useEffect(() => {
        let cancelled = false

        async function init() {
            setIsInitializing(true)
            setError(null)

            const result = await createConversation(
                `Task: ${taskTitle}`,
                taskId,
            )

            if (cancelled) return

            if (result?.error) {
                setError(result.error)
                setIsInitializing(false)
                return
            }

            if (result?.id) {
                setConversationId(result.id)
                // Load existing messages (in case reopening a conversation)
                await loadMessages(result.id)
            }
            setIsInitializing(false)
            inputRef.current?.focus()
        }

        init()
        return () => { cancelled = true }
    }, [taskId, taskTitle, loadMessages])

    // When we detect processing state, start polling
    useEffect(() => {
        if (isProcessing && conversationId) {
            startPolling(conversationId)
        }
        return () => {
            if (!isProcessing) stopPolling()
        }
    }, [isProcessing, conversationId, startPolling, stopPolling])

    const handleSend = async () => {
        if (!input.trim() || !conversationId || isSending || isProcessing) return

        const content = input.trim()
        setInput('')
        setError(null)
        setIsSending(true)

        // Optimistically add user message
        const userMessage: Message = { role: 'user', content }
        setMessages(prev => [...prev, userMessage])

        try {
            const result = await sendMessageBackground(conversationId, content)

            if (result?.error) {
                setError(result.error)
                setIsSending(false)
                return
            }

            // Message sent successfully — AI is now processing in background
            setIsProcessing(true)
            startPolling(conversationId)
        } catch (err: any) {
            setError(err.message || 'Failed to send message')
        } finally {
            setIsSending(false)
        }
    }

    /**
     * Save AI findings to task and sync to external source
     */
    const handleSaveToTask = async (messageId: string, content: string) => {
        setSavingMessageId(messageId)
        setSyncFeedback((prev) => ({ ...prev, [messageId]: 'saving' }))

        try {
            const result = await saveAiToTask(taskId, content, conversationId || undefined)

            if (result?.error) {
                setSyncFeedback((prev) => ({ ...prev, [messageId]: `Error: ${result.error}` }))
                return
            }

            setSavedMessages((prev) => new Set(prev).add(messageId))

            if (result.sync?.success && result.sync?.provider) {
                setSyncFeedback((prev) => ({
                    ...prev,
                    [messageId]: `Saved & synced to ${result.sync.provider}`,
                }))
            } else if (result.sync?.error) {
                setSyncFeedback((prev) => ({
                    ...prev,
                    [messageId]: `Saved locally (sync failed: ${result.sync.error})`,
                }))
            } else {
                setSyncFeedback((prev) => ({ ...prev, [messageId]: 'Saved to task' }))
            }

        } catch (err: any) {
            setSyncFeedback((prev) => ({ ...prev, [messageId]: `Error: ${err.message}` }))
        } finally {
            setSavingMessageId(null)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex flex-col border border-primary/20 rounded-xl bg-background/80 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-primary/20">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        'w-2 h-2 rounded-full',
                        isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-primary animate-pulse',
                    )} />
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        AI Assistant
                    </span>
                    {isProcessing && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                            Processing
                        </span>
                    )}
                    {sourceProvider && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground capitalize">
                            <ExternalLink className="w-2.5 h-2.5 inline mr-0.5" />
                            {sourceProvider}
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                    title={isProcessing ? 'Close — AI will continue in background' : 'Close'}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 max-h-[300px] overflow-y-auto p-3 space-y-3">
                {isInitializing && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        Starting AI session...
                    </div>
                )}

                {messages.map((msg, i) => {
                    const messageId = msg.id || `msg-${i}`
                    const isSaved = savedMessages.has(messageId)
                    const isSaving = savingMessageId === messageId
                    const feedback = syncFeedback[messageId]
                    const isError = msg.metadata?.error === true

                    // Skip system error messages, show them as error banner instead
                    if (msg.role === 'system' && isError) {
                        return (
                            <div key={messageId} className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                                {msg.content}
                            </div>
                        )
                    }

                    if (msg.role === 'system') return null

                    return (
                        <div key={messageId}>
                            <div
                                className={cn(
                                    'text-sm rounded-lg px-3 py-2 max-w-[90%]',
                                    msg.role === 'user'
                                        ? 'bg-primary/20 text-primary ml-auto'
                                        : 'bg-accent/50 border border-border',
                                )}
                            >
                                <div className="whitespace-pre-wrap break-words">
                                    {msg.content}
                                </div>
                            </div>
                            {/* Save to task button for assistant messages */}
                            {msg.role === 'assistant' && msg.content.length > 50 && (
                                <div className="flex items-center gap-2 mt-1 ml-1">
                                    {isSaved ? (
                                        <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                                            <CheckCircle className="w-3 h-3" />
                                            {feedback || 'Saved'}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleSaveToTask(messageId, msg.content)}
                                            disabled={isSaving}
                                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                            title="Save findings to task and sync to source"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <FileDown className="w-3 h-3" />
                                            )}
                                            {isSaving ? 'Saving & syncing...' : 'Save to task & sync'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}

                {isProcessing && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
                        <span>
                            AI is thinking in the background...
                            <span className="block text-[10px] text-muted-foreground mt-0.5">
                                You can close this panel. The task will move to &quot;In Review&quot; when ready.
                            </span>
                        </span>
                    </div>
                )}

                {error && (
                    <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isProcessing ? 'Wait for AI to respond...' : 'Ask the AI assistant...'}
                        disabled={isSending || isProcessing || !conversationId}
                        className="flex-1 bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm placeholder-muted-foreground outline-none focus:border-primary/30 transition-colors disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isSending || isProcessing || !conversationId}
                        className="p-2 bg-primary/20 border border-primary/30 rounded-lg text-primary hover:bg-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
