'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getDefaultCategories, createBulkCategories, createSource, completeOnboarding } from './actions'
import { OnboardingLayout } from './components/onboarding-layout'
import { StepWelcome } from './components/step-welcome'
import { StepChecklist } from './components/step-checklist'
import { StepCategories } from './components/step-categories'
import type { DefaultCategory } from './components/category-card'

// ============================================================================
// Main Onboarding Page
// ============================================================================

interface PendingIntegration {
    provider: string
    token: string
}

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [pendingIntegrations, setPendingIntegrations] = useState<PendingIntegration[]>([])
    const [categoriesDefined, setCategoriesDefined] = useState(false)
    const [createdCategoryId, setCreatedCategoryId] = useState<string | null>(null)
    const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([])
    const [defaultCategories, setDefaultCategories] = useState<DefaultCategory[]>([])
    const [completing, setCompleting] = useState(false)
    const [isFinishing, setIsFinishing] = useState(false)

    // Fetch default categories on mount
    useEffect(() => {
        async function fetchDefaults() {
            const cats = await getDefaultCategories()
            if (cats && cats.length > 0) {
                setDefaultCategories(cats)
            } else {
                // Hardcoded fallback
                setDefaultCategories([
                    { name: 'Personal Life', color: '#EC4899', icon: 'Heart' },
                    { name: 'Year Goals Tasks', color: '#F97316', icon: 'Target' },
                    { name: 'Work', color: '#3B82F6', icon: 'Briefcase' },
                    { name: 'Studies', color: '#8B5CF6', icon: 'BookOpen' },
                ])
            }
        }
        fetchDefaults()
    }, [])

    // Calculate completion percentage
    const completionPercentage = (() => {
        let completed = 0
        const total = 4
        if (step > 1) completed++
        if (pendingIntegrations.length > 0) completed++
        if (categoriesDefined) completed++
        if (step === 3) completed++
        return Math.round((completed / total) * 100)
    })()

    // Handle integration connection (just stores token, no API call)
    const handleConnectIntegration = (integration: PendingIntegration) => {
        setPendingIntegrations(prev => {
            // Replace if same provider, otherwise add
            const filtered = prev.filter(p => p.provider !== integration.provider)
            return [...filtered, integration]
        })
        setStep(2)
    }

    // Handle categories finished: go back to checklist (NOT dashboard)
    const handleFinishWithCategories = async (categories: DefaultCategory[]) => {
        setIsFinishing(true)
        try {
            if (categories.length > 0) {
                const result = await createBulkCategories(categories)
                // Store the first category ID for linking sources later
                if (result && Array.isArray(result) && result.length > 0) {
                    setCreatedCategoryId(result[0].id)
                } else if (result && !result.error && result.id) {
                    setCreatedCategoryId(result.id)
                }
            }
            setCategoriesDefined(true)
            setSelectedCategoryNames(categories.map((c) => c.name))
            // Go back to checklist instead of dashboard
            setStep(2)
        } catch {
            // Even on error, go back to checklist
            setCategoriesDefined(true)
            setSelectedCategoryNames(categories.map((c) => c.name))
            setStep(2)
        } finally {
            setIsFinishing(false)
        }
    }

    // Handle "Go to Dashboard" from checklist: create sources + complete
    const handleGoToDashboard = async () => {
        setIsFinishing(true)
        try {
            // Create sources for pending integrations if we have a category ID
            if (pendingIntegrations.length > 0 && createdCategoryId) {
                for (const integration of pendingIntegrations) {
                    await createSource({
                        provider: integration.provider,
                        category_id: createdCategoryId,
                        config: { api_key: integration.token },
                        sync_interval_minutes: 15,
                    })
                }
            }

            // Store progress in localStorage for sidebar widget
            if (typeof window !== 'undefined') {
                localStorage.setItem('onboarding_progress', JSON.stringify({
                    source_connected: pendingIntegrations.length > 0,
                    categories_defined: categoriesDefined,
                    openclaw_configured: false,
                }))
            }

            await completeOnboarding()
            router.push('/dashboard/tasks')
        } catch {
            // Always redirect even on error
            try { await completeOnboarding() } catch { /* ignore */ }
            router.push('/dashboard/tasks')
        }
    }

    // Handle skip all: create defaults + complete
    const handleSkipAll = async () => {
        setCompleting(true)
        try {
            if (defaultCategories.length > 0) {
                await createBulkCategories(defaultCategories)
            }
            await completeOnboarding()
        } catch {
            try { await completeOnboarding() } catch { /* ignore */ }
        } finally {
            router.push('/dashboard/tasks')
        }
    }

    return (
        <OnboardingLayout
            step={step}
            totalSteps={3}
            completionPercentage={completionPercentage}
        >
            {/* Step 1: Welcome & Connect */}
            {step === 1 && (
                <StepWelcome
                    onConnectIntegration={handleConnectIntegration}
                    onSkipIntegration={() => setStep(2)}
                    onSetupManually={() => setStep(2)}
                    onSkipAll={handleSkipAll}
                />
            )}

            {/* Step 2: Setup Checklist */}
            {step === 2 && (
                <StepChecklist
                    sourceConnected={pendingIntegrations.length > 0}
                    connectedProviders={pendingIntegrations.map(p => p.provider)}
                    categoriesDefined={categoriesDefined}
                    openclawConfigured={false}
                    selectedCategoryNames={selectedCategoryNames}
                    onConnectSource={() => setStep(1)}
                    onDefineCategories={() => setStep(3)}
                    onGoToDashboard={handleGoToDashboard}
                    onSkip={handleSkipAll}
                    isFinishing={isFinishing}
                />
            )}

            {/* Step 3: Category Customization */}
            {step === 3 && (
                <StepCategories
                    defaultCategories={defaultCategories}
                    onFinish={handleFinishWithCategories}
                    onBack={() => setStep(2)}
                    isFinishing={isFinishing}
                />
            )}

            {/* Completing overlay */}
            {completing && (
                <div className="fixed inset-0 bg-[#0F172A]/90 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#FF4500]" />
                        <p className="text-lg font-medium text-slate-50">
                            Setting up your workspace...
                        </p>
                        <p className="text-sm text-slate-400">
                            Creating your categories and preparing your dashboard
                        </p>
                    </div>
                </div>
            )}
        </OnboardingLayout>
    )
}
