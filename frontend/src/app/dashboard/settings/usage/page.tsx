'use client'

import { useState, useEffect } from 'react'
import { isCommunityEdition } from '@/lib/edition'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, DollarSign, MessageSquare, Zap, ExternalLink, TrendingUp, BarChart3, Layers, Tag, Cloud } from 'lucide-react'
import { getUsageSummary, getUsageBreakdown } from './actions'

interface UsageSummary {
    totalMessages: number
    totalTokens: number
    estimatedCost: number
    langfuseEnabled: boolean
    period: string
    byDay: Array<{
        date: string
        messages: number
        tokens: number
        cost: number
    }>
}

interface UsageBreakdown {
    byTask: Array<{
        task_id: string
        task_title: string
        category_id: string | null
        category_name: string | null
        messages: number
        tokens: number
        cost: number
    }>
    byCategory: Array<{
        category_id: string | null
        category_name: string | null
        tasks: number
        messages: number
        tokens: number
        cost: number
    }>
}

export default function UsagePage() {
    if (isCommunityEdition) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 pt-0">
                <Cloud className="h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-2xl font-bold tracking-tight">AI Usage & Costs</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    AI usage tracking and cost analytics is available on TaskClaw Cloud.
                    The self-hosted community edition has no usage limits.
                </p>
                <a
                    href="https://taskclaw.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                >
                    Learn more about TaskClaw Cloud
                </a>
            </div>
        )
    }

    const [usage, setUsage] = useState<UsageSummary | null>(null)
    const [breakdown, setBreakdown] = useState<UsageBreakdown | null>(null)
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(30)

    useEffect(() => {
        loadUsage()
    }, [days])

    async function loadUsage() {
        setLoading(true)
        const [summaryData, breakdownData] = await Promise.all([
            getUsageSummary(days),
            getUsageBreakdown(days),
        ])
        setUsage(summaryData)
        setBreakdown(breakdownData)
        setLoading(false)
    }

    function formatNumber(n: number): string {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
        return n.toString()
    }

    function formatCost(n: number): string {
        if (n < 0.01) return `$${n.toFixed(4)}`
        return `$${n.toFixed(2)}`
    }

    // Calculate max values for the chart bars
    const maxTokens = usage?.byDay?.length
        ? Math.max(...usage.byDay.map(d => d.tokens), 1)
        : 1

    const maxTaskTokens = breakdown?.byTask?.length
        ? Math.max(...breakdown.byTask.map(t => t.tokens), 1)
        : 1

    const maxCatTokens = breakdown?.byCategory?.length
        ? Math.max(...breakdown.byCategory.map(c => c.tokens), 1)
        : 1

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">AI Usage & Costs</h2>
                    <p className="text-muted-foreground">
                        Monitor your AI token consumption and estimated costs.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {[7, 30, 90].map(d => (
                        <Button
                            key={d}
                            variant={days === d ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDays(d)}
                        >
                            {d}d
                        </Button>
                    ))}
                </div>
            </div>

            {/* Langfuse status banner */}
            {usage && !usage.langfuseEnabled && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardContent className="flex items-center gap-3 py-3">
                        <Activity className="h-5 w-5 text-amber-500" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                Advanced observability is disabled
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Set <code className="bg-muted px-1 rounded">LANGFUSE_PUBLIC_KEY</code> and{' '}
                                <code className="bg-muted px-1 rounded">LANGFUSE_SECRET_KEY</code> in your backend .env to
                                enable detailed LLM tracing with Langfuse.
                            </p>
                        </div>
                        <a
                            href="https://langfuse.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Langfuse
                            </Button>
                        </a>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : usage ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(usage.totalMessages)}</div>
                                <p className="text-xs text-muted-foreground">
                                    AI responses in the last {days} days
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                                <Zap className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(usage.totalTokens)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Tokens consumed across all conversations
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCost(usage.estimatedCost)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Based on model pricing estimates
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Usage by Category */}
                    {breakdown && breakdown.byCategory.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Usage by Category
                                </CardTitle>
                                <CardDescription>
                                    Token consumption grouped by task category
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {breakdown.byCategory.map(cat => (
                                        <div key={cat.category_id || '__none'} className="flex items-center gap-3">
                                            <span className="text-xs font-medium w-28 shrink-0 truncate">
                                                {cat.category_name || 'Uncategorized'}
                                            </span>
                                            <div className="flex-1 h-7 bg-muted rounded-sm overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500/60 rounded-sm transition-all duration-300 flex items-center px-2"
                                                    style={{ width: `${Math.max((cat.tokens / maxCatTokens) * 100, 4)}%` }}
                                                >
                                                    {cat.tokens / maxCatTokens > 0.15 && (
                                                        <span className="text-[10px] text-white font-medium truncate">
                                                            {formatNumber(cat.tokens)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <Badge variant="secondary" className="text-xs font-mono">
                                                    {formatNumber(cat.tokens)} tok
                                                </Badge>
                                                <span className="text-xs text-muted-foreground w-16 text-right">
                                                    {cat.tasks} task{cat.tasks !== 1 ? 's' : ''}
                                                </span>
                                                <span className="text-xs text-muted-foreground w-16 text-right font-mono">
                                                    {formatCost(cat.cost)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Usage by Task */}
                    {breakdown && breakdown.byTask.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="h-5 w-5" />
                                    Usage by Task
                                </CardTitle>
                                <CardDescription>
                                    Top tasks by token consumption ({breakdown.byTask.length} tasks with AI usage)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {breakdown.byTask.slice(0, 20).map(task => (
                                        <div key={task.task_id} className="flex items-center gap-3">
                                            <div className="w-44 shrink-0">
                                                <span className="text-xs font-medium truncate block">
                                                    {task.task_title}
                                                </span>
                                                {task.category_name && (
                                                    <span className="text-[10px] text-muted-foreground truncate block">
                                                        {task.category_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                                                <div
                                                    className="h-full bg-primary/60 rounded-sm transition-all duration-300"
                                                    style={{ width: `${Math.max((task.tokens / maxTaskTokens) * 100, 2)}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <Badge variant="secondary" className="text-xs font-mono">
                                                    {formatNumber(task.tokens)} tok
                                                </Badge>
                                                <span className="text-xs text-muted-foreground w-14 text-right">
                                                    {task.messages} msg{task.messages !== 1 ? 's' : ''}
                                                </span>
                                                <span className="text-xs text-muted-foreground w-16 text-right font-mono">
                                                    {formatCost(task.cost)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {breakdown.byTask.length > 20 && (
                                        <p className="text-xs text-muted-foreground text-center pt-2">
                                            Showing top 20 of {breakdown.byTask.length} tasks
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Daily Usage Chart */}
                    {usage.byDay.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Daily Token Usage
                                </CardTitle>
                                <CardDescription>
                                    Token consumption per day over the last {days} days
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {usage.byDay.map(day => (
                                        <div key={day.date} className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground w-20 shrink-0">
                                                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                            <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                                                <div
                                                    className="h-full bg-primary/70 rounded-sm transition-all duration-300"
                                                    style={{ width: `${Math.max((day.tokens / maxTokens) * 100, 2)}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <Badge variant="secondary" className="text-xs font-mono">
                                                    {formatNumber(day.tokens)} tok
                                                </Badge>
                                                <span className="text-xs text-muted-foreground w-14 text-right">
                                                    {day.messages} msg{day.messages !== 1 ? 's' : ''}
                                                </span>
                                                <span className="text-xs text-muted-foreground w-16 text-right font-mono">
                                                    {formatCost(day.cost)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground text-center">
                                    No AI usage data yet for the last {days} days.
                                    <br />
                                    <span className="text-sm">Start a conversation to see usage metrics.</span>
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Langfuse deep link */}
                    {usage.langfuseEnabled && (
                        <Card>
                            <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="text-sm font-medium">Langfuse Observability Active</p>
                                        <p className="text-xs text-muted-foreground">
                                            Detailed traces, token breakdowns, and cost analytics are being sent to Langfuse.
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={process.env.NEXT_PUBLIC_LANGFUSE_URL || 'https://cloud.langfuse.com'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline" size="sm">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Open Langfuse Dashboard
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>
                    )}
                </>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Failed to load usage data.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
