'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, X } from "lucide-react"
import { createPlan, updatePlan } from './actions'
import { toast } from "sonner"

interface PlanDialogProps {
    plan: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onClose: () => void
}

export function PlanDialog({ plan, open, onOpenChange, onClose }: PlanDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        price_cents: 0,
        interval: 'month' as 'month' | 'year',
        features: [] as string[],
        is_default: false,
        is_hidden: false,
    })
    const [newFeature, setNewFeature] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name,
                price_cents: plan.price_cents,
                interval: plan.interval || 'month',
                features: plan.features || [],
                is_default: plan.is_default || false,
                is_hidden: plan.is_hidden || false,
            })
        } else {
            setFormData({
                name: '',
                price_cents: 0,
                interval: 'month',
                features: [],
                is_default: false,
                is_hidden: false,
            })
        }
    }, [plan, open])

    const handleAddFeature = () => {
        if (!newFeature.trim()) return
        setFormData(prev => ({
            ...prev,
            features: [...prev.features, newFeature.trim()]
        }))
        setNewFeature('')
    }

    const removeFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        let res
        if (plan) {
            res = await updatePlan(plan.id, formData)
        } else {
            res = await createPlan(formData)
        }
        setSaving(false)

        if (res.error) {
            toast.error("Error", { description: res.error })
        } else {
            const syncMsg = res.stripe_sync_status === 'synced'
                ? ' (Stripe synced)'
                : res.stripe_sync_status === 'failed'
                ? ` (Warning: Stripe sync failed${res.stripe_sync_error ? ': ' + res.stripe_sync_error : ''})`
                : ' (Stripe not configured)'

            if (res.stripe_sync_status === 'failed') {
                toast.warning("Plan saved", { description: `Plan ${plan ? 'updated' : 'created'} but Stripe sync failed. You can retry by editing the plan.` })
            } else {
                toast.success("Success", { description: `Plan ${plan ? 'updated' : 'created'} successfully${syncMsg}` })
            }
            onClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{plan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                    <DialogDescription>
                        Configure subscription tier details. Plans are automatically synced with Stripe.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Plan Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price">Price (Cents)</Label>
                        <Input
                            id="price"
                            type="number"
                            value={formData.price_cents}
                            onChange={(e) => setFormData({ ...formData, price_cents: Number(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                            ${(formData.price_cents / 100).toFixed(2)} / {formData.interval}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="interval">Billing Interval</Label>
                        <Select
                            value={formData.interval}
                            onValueChange={(value) => setFormData({ ...formData, interval: value as 'month' | 'year' })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="month">Monthly</SelectItem>
                                <SelectItem value="year">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Features</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                placeholder="Add feature..."
                                onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                            />
                            <Button type="button" size="icon" onClick={handleAddFeature}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-2 mt-2">
                            {formData.features.map((feature, i) => (
                                <div key={i} className="flex items-center justify-between rounded-md border p-2 text-sm">
                                    <span>{feature}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFeature(i)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="default">Default Plan</Label>
                        <Switch
                            id="default"
                            checked={formData.is_default}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="hidden">Hidden</Label>
                        <Switch
                            id="hidden"
                            checked={formData.is_hidden}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_hidden: checked })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
