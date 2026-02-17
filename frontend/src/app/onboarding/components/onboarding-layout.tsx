'use client'

import { BrandLogo } from '@/components/brand-logo'

interface OnboardingLayoutProps {
    children: React.ReactNode
    step: number
    totalSteps: number
    completionPercentage: number
}

export function OnboardingLayout({
    children,
    step,
    totalSteps,
    completionPercentage,
}: OnboardingLayoutProps) {
    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-50 flex flex-col relative overflow-hidden">
            {/* Subtle circuit grid background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Radial glow from top */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse at center, rgba(255, 69, 0, 0.06) 0%, transparent 70%)',
                }}
            />

            {/* Top progress bar */}
            <div className="relative z-10 w-full h-1 bg-slate-800">
                <div
                    className="h-full bg-[#FF4500] transition-all duration-700 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4">
                <BrandLogo variant="horizontal" className="text-slate-50" />
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Step {step} of {totalSteps}
                    </span>
                    <span className="text-xs font-bold text-[#FF4500]">
                        {completionPercentage}% Complete
                    </span>
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                {children}
            </div>

            {/* Footer */}
            <div className="relative z-10 text-center pb-6 text-sm text-slate-500">
                Need help?{' '}
                <a href="#" className="text-[#FF4500] hover:underline">
                    Chat with support
                </a>{' '}
                or{' '}
                <a href="#" className="text-[#FF4500] hover:underline">
                    read the guide
                </a>
                .
            </div>
        </div>
    )
}
