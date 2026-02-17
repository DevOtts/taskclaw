import { cookies } from 'next/headers'
import { getUserAccounts } from "@/app/dashboard/actions"
import { GeneralSettingsForm } from "./general-settings-form"

export default async function GeneralSettingsPage() {
    const accounts = await getUserAccounts()
    const cookieStore = await cookies()
    const activeAccountId = cookieStore.get('current_account_id')?.value

    let activeAccount = accounts.find((a: any) => a.id === activeAccountId)

    if (!activeAccount && accounts.length > 0) {
        activeAccount = accounts[0]
    }

    if (!activeAccount) {
        return <div>No accounts found.</div>
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account settings.
                    </p>
                </div>
            </div>
            <GeneralSettingsForm account={activeAccount} />
        </div>
    )
}
