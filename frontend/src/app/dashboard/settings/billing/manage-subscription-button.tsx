'use client'

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { createPortalSession } from "./actions"

export function ManageSubscriptionButton() {
    const [loading, setLoading] = useState(false)

    async function handleManage() {
        setLoading(true)
        try {
            const result = await createPortalSession()

            if (result.error) {
                toast.error(result.error)
                return
            }

            if (result.url) {
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
        <Button variant="outline" onClick={handleManage} disabled={loading}>
            {loading ? "Loading..." : "Manage Subscription"}
        </Button>
    )
}
