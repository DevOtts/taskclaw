'use client'

import { useState, useEffect } from 'react'
import { getAdminAccounts } from './actions'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Building2 } from "lucide-react"
import { DataViewLayout } from '@/components/data-view-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function AccountsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [accounts, setAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchAccounts = async () => {
        setLoading(true)
        const res = await getAdminAccounts(page, 10, search)
        if (res?.data) {
            setAccounts(res.data)
            setTotalPages(res.meta.totalPages)
        }
        setLoading(false)
    }

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchAccounts()
        }, 300)
        return () => clearTimeout(debounce)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, page])

    const filters = (
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search accounts..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
    )

    const paginationFooter = (
        <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    )

    return (
        <DataViewLayout
            title="Accounts"
            description="Overview of all team accounts."
            itemName="accounts"
            items={accounts}
            loading={loading}
            filters={filters}
            footer={paginationFooter}
            renderGridItem={(account) => (
                <Card className="h-full">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <CardTitle className="text-base">{account.name}</CardTitle>
                            <CardDescription className="text-xs">
                                Created {new Date(account.created_at).toLocaleDateString()}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Owner:</span>
                                <span className="font-medium">{account.ownerEmail}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant="secondary">Active</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            renderTable={(items) => (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((account) => (
                            <TableRow key={account.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span className="font-medium">{account.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{account.ownerEmail}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {new Date(account.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">Active</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        />
    )
}
