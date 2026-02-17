'use client'

import { useActionState } from 'react'
import { forgotPassword } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'

export default function ForgotPasswordPage() {
    const [state, formAction, isPending] = useActionState(forgotPassword, null)

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <BrandLogo variant="horizontal" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email to receive a password reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        {state?.error && (
                            <Alert variant="destructive">
                                <AlertDescription>{state.error}</AlertDescription>
                            </Alert>
                        )}
                        {state?.success && (
                            <Alert className="text-green-600 border-green-600 bg-green-50">
                                <AlertDescription>Check your email for the reset link.</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/login" className="text-sm text-primary hover:underline">
                        Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
