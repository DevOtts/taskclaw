import { cookies } from 'next/headers'
import { isCommunityEdition } from '@/lib/edition'
import { getPlans, getAccountSubscription, getUserAccounts } from "@/app/dashboard/actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PlanCard } from "./plan-card"
import { ManageSubscriptionButton } from "./manage-subscription-button"
import { CalendarDays, CreditCard, Receipt, Sparkles, AlertCircle, Cloud } from "lucide-react"

export default async function BillingPage() {
    if (isCommunityEdition) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 pt-0">
                <Cloud className="h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-2xl font-bold tracking-tight">Billing & Plans</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Billing and subscription management is available on TaskClaw Cloud.
                    The self-hosted community edition has no usage limits.
                </p>
                <a
                    href="https://taskclaw.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                >
                    Learn more about TaskClaw Cloud
                </a>
            </div>
        )
    }

    const accounts = await getUserAccounts()
    const cookieStore = await cookies()
    let activeAccountId = cookieStore.get('current_account_id')?.value

    if (!activeAccountId && accounts.length > 0) {
        activeAccountId = accounts[0].id
    }

    if (!activeAccountId) {
        return <div>No active account found.</div>
    }

    const plans = await getPlans()
    const subscription = await getAccountSubscription(activeAccountId)

    const currentPlan = subscription?.plan
    const currentPlanId = subscription?.plan_id

    const periodEnd = subscription?.current_period_end
        ? new Date(subscription.current_period_end)
        : null
    const periodStart = subscription?.current_period_start
        ? new Date(subscription.current_period_start)
        : null

    const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
    const isCanceled = subscription?.status === 'canceled'
    const isPastDue = subscription?.status === 'past_due'

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Billing & Plans</h2>
                <p className="text-muted-foreground">
                    Manage your subscription and billing details.
                </p>
            </div>

            {/* Current Subscription Card */}
            {subscription && currentPlan ? (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">{currentPlan.name} Plan</CardTitle>
                                    <CardDescription>
                                        <span className="text-lg font-semibold text-foreground">
                                            ${(currentPlan.price_cents / 100).toFixed(2)}
                                        </span>
                                        <span className="text-muted-foreground">/{currentPlan.interval}</span>
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isActive && (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                                        Active
                                    </Badge>
                                )}
                                {isCanceled && (
                                    <Badge variant="destructive">Canceled</Badge>
                                )}
                                {isPastDue && (
                                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                        Past Due
                                    </Badge>
                                )}
                                {subscription.status === 'trialing' && (
                                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                        Trial
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Separator className="mb-4" />
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Billing Period */}
                            {periodStart && periodEnd && (
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Current Period</p>
                                        <p className="text-sm text-muted-foreground">
                                            {periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            {' – '}
                                            {periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Next Renewal */}
                            {periodEnd && (
                                <div className="flex items-start gap-3">
                                    <Receipt className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {isCanceled ? 'Access Until' : 'Next Renewal'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {periodEnd.toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Next Invoice Amount */}
                            {isActive && currentPlan.price_cents > 0 && (
                                <div className="flex items-start gap-3">
                                    <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Next Invoice</p>
                                        <p className="text-sm text-muted-foreground">
                                            ${(currentPlan.price_cents / 100).toFixed(2)} {currentPlan.currency?.toUpperCase() || 'USD'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Past Due Warning */}
                        {isPastDue && (
                            <div className="mt-4 flex items-center gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-500">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>Your payment is past due. Please update your payment method to avoid service interruption.</p>
                            </div>
                        )}

                        {/* Canceled Notice */}
                        {isCanceled && periodEnd && (
                            <div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>Your subscription has been canceled. You&apos;ll retain access until {periodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <ManageSubscriptionButton />
                    </CardFooter>
                </Card>
            ) : (
                <Card className="border-dashed">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <Sparkles className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <CardTitle>No Active Subscription</CardTitle>
                                <CardDescription>
                                    You&apos;re currently on the free tier. Upgrade to unlock more features.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="secondary">Free</Badge>
                    </CardContent>
                </Card>
            )}

            {/* Plan Options */}
            <div>
                <h3 className="text-lg font-semibold mb-4">
                    {subscription ? 'Change Plan' : 'Choose a Plan'}
                </h3>
                <div className="grid gap-6 md:grid-cols-3">
                    {plans
                        .filter((plan: any) => !plan.is_hidden)
                        .map((plan: any) => {
                            const isCurrent = currentPlanId === plan.id
                            return (
                                <PlanCard key={plan.id} plan={plan} isCurrent={isCurrent} />
                            )
                        })}
                </div>
            </div>
        </div>
    )
}
