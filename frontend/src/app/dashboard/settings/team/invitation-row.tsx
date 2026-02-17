'use client'

import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { deleteInvitation } from "@/app/dashboard/actions"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function InvitationRow({ invite, accountId }: { invite: any, accountId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleRevoke() {
        if (!confirm('Are you sure you want to revoke this invitation?')) return

        setLoading(true)
        try {
            await deleteInvitation(accountId, invite.id)
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <TableRow>
            <TableCell>{invite.email}</TableCell>
            <TableCell>
                <Badge variant="outline" className="capitalize">
                    {invite.role}
                </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
                {new Date(invite.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRevoke}
                    disabled={loading}
                >
                    {loading ? 'Revoking...' : 'Revoke'}
                </Button>
            </TableCell>
        </TableRow>
    )
}
