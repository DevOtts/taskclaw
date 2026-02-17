import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BrandLogo } from '@/components/brand-logo'

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
                    <BrandLogo variant="horizontal" />

                    <div className="space-y-2">
                        <h1 className="text-7xl font-extrabold tracking-tight text-foreground">
                            404
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Page not found
                        </p>
                        <p className="text-sm text-muted-foreground">
                            The page you are looking for doesn&apos;t exist or has been moved.
                        </p>
                    </div>

                    <Button asChild size="lg">
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
