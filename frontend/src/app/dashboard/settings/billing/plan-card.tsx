'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { createCheckoutSession } from "./actions"

export function PlanCard({ plan, isCurrent }: { plan: any, isCurrent: boolean }) {
    const [loading, setLoading] = useState(false)

    async function handleUpgrade() {
        setLoading(true)
        try {
            const result = await createCheckoutSession(plan.id)

            if (result.error) {
                toast.error(result.error)
                return
            }

            if (result.url) {
                // Redirect to Stripe Checkout
                window.location.href = result.url
                return
            }

            toast.error("Unexpected response from server")
        } catch (error: any) {
            toast.error(error.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className={isCurrent ? "border-primary" : ""}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrent && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>
                    <span className="text-2xl font-bold">${plan.price_cents / 100}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm">
                    {plan.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    disabled={isCurrent || loading}
                    variant={isCurrent ? "outline" : "default"}
                    onClick={handleUpgrade}
                >
                    {loading ? "Processing..." : (isCurrent ? "Current Plan" : "Upgrade")}
                </Button>
            </CardFooter>
        </Card>
    )
}
