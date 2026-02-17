'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BrandLogo } from '@/components/brand-logo'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global error:', error)
    }, [error])

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
                    <BrandLogo variant="horizontal" />

                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Something went wrong
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            An unexpected error occurred. Please try again or return to the dashboard.
                        </p>
                        {error.digest && (
                            <p className="text-xs text-muted-foreground font-mono">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button onClick={reset} variant="default" className="flex-1">
                            Try again
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
