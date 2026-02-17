'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { updateAccount } from '@/app/dashboard/actions'

import { toast } from "sonner"

export function GeneralSettingsForm({ account }: { account: any }) {
    const [name, setName] = useState(account.name)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const result = await updateAccount(account.id, name)
            if (result.error) {
                toast.error(result.error)
                return
            }
            toast.success("Account name updated successfully")
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Account Name</CardTitle>
                    <CardDescription>
                        Used to identify your organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate}>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Account Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
