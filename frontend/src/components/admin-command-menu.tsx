'use client'

import * as React from "react"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Building2,
    FolderKanban,
    Search,
    Loader2,
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { searchAdminItems } from "@/app/admin/actions"

export function AdminCommandMenu() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<{ users: any[], accounts: any[], projects: any[] }>({ users: [], accounts: [], projects: [] })
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    React.useEffect(() => {
        if (!query || query.length < 2) {
            setResults({ users: [], accounts: [], projects: [] })
            return
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true)
            try {
                const data = await searchAdminItems(query)
                setResults(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [query])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <Button
                variant="outline"
                className="relative h-8 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
                onClick={() => setOpen(true)}
            >
                <span className="hidden lg:inline-flex">Search...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Type a command or search..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            "No results found."
                        )}
                    </CommandEmpty>

                    {(results.users.length > 0 || results.accounts.length > 0 || results.projects.length > 0) && (
                        <>
                            {results.users.length > 0 && (
                                <CommandGroup heading="Users">
                                    {results.users.map((user) => (
                                        <CommandItem
                                            key={user.id}
                                            onSelect={() => runCommand(() => router.push(user.url))}
                                        >
                                            <User className="mr-2 h-4 w-4" />
                                            <span>{user.title}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">{user.subtitle}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {results.accounts.length > 0 && (
                                <CommandGroup heading="Accounts">
                                    {results.accounts.map((account) => (
                                        <CommandItem
                                            key={account.id}
                                            onSelect={() => runCommand(() => router.push(account.url))}
                                        >
                                            <Building2 className="mr-2 h-4 w-4" />
                                            <span>{account.title}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {results.projects.length > 0 && (
                                <CommandGroup heading="Projects">
                                    {results.projects.map((project) => (
                                        <CommandItem
                                            key={project.id}
                                            onSelect={() => runCommand(() => router.push(project.url))}
                                        >
                                            <FolderKanban className="mr-2 h-4 w-4" />
                                            <span>{project.title}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            <CommandSeparator />
                        </>
                    )}

                    <CommandGroup heading="Navigation">
                        <CommandItem onSelect={() => runCommand(() => router.push("/admin/users"))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Users</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/admin/accounts"))}>
                            <Building2 className="mr-2 h-4 w-4" />
                            <span>Accounts</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/admin/plans"))}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Plans</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
