import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'

export default function DashboardNotFound() {
    return (
        <div className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <FileQuestion className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl">Page not found</CardTitle>
                    <CardDescription>
                        The dashboard page you are looking for doesn&apos;t exist or has been moved.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
