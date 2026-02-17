
'use client'

import { useState, useEffect } from 'react'
import { approveUser, getAdminUsers } from '../actions'
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal, Plus, CheckCircle2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserSheet } from './user-sheet'
import { DataViewLayout } from '@/components/data-view-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UsersPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending'>('all')

    const fetchUsers = async () => {
        setLoading(true)
        const status = statusFilter === 'pending' ? 'pending' : ''
        const res = await getAdminUsers(page, 10, search, status)
        if (res?.data) {
            let data = res.data
            // Client-side fallback filtering if backend doesn't apply status filter yet
            if (status === 'pending') {
                data = data.filter((u: any) => String(u.status || '').toLowerCase() === 'pending')
            }
            setUsers(data)
            setTotalPages(res.meta.totalPages)
        }
        setLoading(false)
    }

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchUsers()
        }, 300)
        return () => clearTimeout(debounce)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, page, statusFilter])

    const handleEdit = (userId: string) => {
        setSelectedUser(userId)
        setIsSheetOpen(true)
    }

    const handleApprove = async (userId: string) => {
        const res = await approveUser(userId)
        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success('User approved successfully')
            fetchUsers()
        }
    }

    const handleSheetClose = (refresh: boolean) => {
        setIsSheetOpen(false)
        setSelectedUser(null)
        if (refresh) fetchUsers()
    }

    const filters = (
        <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Select
                value={statusFilter}
                onValueChange={(val) => {
                    setStatusFilter(val as 'all' | 'pending')
                    setPage(1)
                }}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="pending">Pending Approval</SelectItem>
                </SelectContent>
            </Select>
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
        <>
            <DataViewLayout
                title="Users"
                description="Manage users and their permissions."
                itemName="users"
                items={users}
                loading={loading}
                actions={
                    <Button onClick={() => setIsSheetOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Invite User
                    </Button>
                }
                filters={filters}
                footer={paginationFooter}
                renderGridItem={(user) => (
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <CardTitle className="text-base">{user.name || user.email || 'Unknown'}</CardTitle>
                                <CardDescription className="text-xs">{user.email}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Role:</span>
                                    <Badge variant={user.app_metadata?.role === 'super_admin' ? 'default' : 'secondary'}>
                                        {user.app_metadata?.role || 'member'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Status:</span>
                                    {user.status === 'pending' ? (
                                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>
                                    ) : user.status === 'suspended' ? (
                                        <Badge variant="outline" className="border-red-500 text-red-600">Suspended</Badge>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                            <span className="text-xs text-muted-foreground">Active</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Instances:</span>
                                    <span>{user.instancesCount}</span>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" /> Actions
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            {user.status === 'pending' && (
                                                <DropdownMenuItem onClick={() => handleApprove(user.id)}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                                    Approve User
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                                                Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">
                                                Deactivate User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                renderTable={(items) => (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Linked Instances</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.name || user.email || 'Unknown'}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.app_metadata?.role === 'super_admin' ? 'default' : 'secondary'}>
                                            {user.app_metadata?.role || 'member'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.status === 'pending' ? (
                                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>
                                        ) : user.status === 'suspended' ? (
                                            <Badge variant="outline" className="border-red-500 text-red-600">Suspended</Badge>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                                <span className="text-sm text-muted-foreground">Active</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>{user.instancesCount} Instances</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                {user.status === 'pending' && (
                                                    <DropdownMenuItem onClick={() => handleApprove(user.id)}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                                        Approve User
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                                                    Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    Deactivate User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            />

            <UserSheet
                userId={selectedUser}
                open={isSheetOpen}
                onOpenChange={(open) => !open && handleSheetClose(false)}
                onClose={() => handleSheetClose(true)}
            />
        </>
    )
}

