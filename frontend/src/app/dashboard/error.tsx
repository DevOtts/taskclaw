'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Dashboard error:', error)
    }, [error])

    return (
        <div className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-7 w-7 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">Dashboard Error</CardTitle>
                    <CardDescription>
                        {error.message || 'An unexpected error occurred in the dashboard.'}
                    </CardDescription>
                    {error.digest && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                            Error ID: {error.digest}
                        </p>
                    )}
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={reset} variant="default">
                        Try again
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/">Back to home</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
