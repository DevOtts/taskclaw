'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function switchAccount(accountId: string) {
    const cookieStore = await cookies()
    cookieStore.set('current_account_id', accountId)
    // In a real app, you might validate that the user belongs to this account
    redirect('/dashboard')
}
