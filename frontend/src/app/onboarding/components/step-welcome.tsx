'use client'

import { useState } from 'react'
import { Rocket, ArrowRight, Settings, Eye, EyeOff } from 'lucide-react'

interface StepWelcomeProps {
    onConnectIntegration: (integration: { provider: string; token: string }) => void
    onSkipIntegration: () => void
    onSetupManually: () => void
    onSkipAll: () => void
}

export function StepWelcome({ onConnectIntegration, onSkipIntegration, onSetupManually, onSkipAll }: StepWelcomeProps) {
    const [activeForm, setActiveForm] = useState<'notion' | 'clickup' | null>(null)
    const [token, setToken] = useState('')
    const [showToken, setShowToken] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const providerConfig = {
        notion: {
            name: 'Notion',
            icon: 'N',
            placeholder: 'ntn_xxxxxxxxxxxxx',
            helpText: 'Create an integration at',
            helpUrl: 'https://www.notion.so/my-integrations',
            helpLabel: 'notion.so/my-integrations',
        },
        clickup: {
            name: 'ClickUp',
            icon: 'C',
            placeholder: 'pk_xxxxxxxxxxxxx',
            helpText: 'Get your API key at',
            helpUrl: 'https://app.clickup.com/settings/apps',
            helpLabel: 'clickup.com/settings/apps',
        },
    }

    const handleConnect = () => {
        if (!activeForm) return
        if (!token.trim()) {
            setError(`Please enter your ${providerConfig[activeForm].name} integration token`)
            return
        }
        onConnectIntegration({ provider: activeForm, token: token.trim() })
    }

    const resetForm = () => {
        setActiveForm(null)
        setToken('')
        setShowToken(false)
        setError(null)
    }

    if (activeForm) {
        const config = providerConfig[activeForm]
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                            <span>{config.icon}</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-50">Connect {config.name}</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Enter your {config.name} integration token to sync your data.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2 mb-6">
                        <label className="text-sm font-medium text-slate-300">
                            Integration Token
                        </label>
                        <div className="relative">
                            <input
                                type={showToken ? 'text' : 'password'}
                                placeholder={config.placeholder}
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConnect()
                                }}
                                autoFocus
                                className="w-full h-11 px-4 pr-10 rounded-lg bg-[#0F172A] border border-[#334155] text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#FF4500]/50 focus:border-[#FF4500]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            {config.helpText}{' '}
                            <a
                                href={config.helpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#FF4500] hover:underline"
                            >
                                {config.helpLabel}
                            </a>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={resetForm}
                            className="flex-1 h-11 rounded-lg border border-[#334155] text-slate-400 font-medium hover:bg-slate-800 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleConnect}
                            disabled={!token.trim()}
                            className="flex-1 h-11 rounded-lg bg-[#FF4500] text-black font-bold hover:bg-[#E63E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            Save &amp; Continue
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={onSkipIntegration}
                        className="w-full mt-4 text-center text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8">
                {/* Rocket icon */}
                <div className="text-center mb-8">
                    <div
                        className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                        style={{
                            background: 'radial-gradient(circle, rgba(255,69,0,0.2) 0%, rgba(255,69,0,0.05) 100%)',
                            boxShadow: '0 0 40px rgba(255, 69, 0, 0.15)',
                        }}
                    >
                        <Rocket className="w-8 h-8 text-[#FF4500]" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">
                        Welcome to TaskClaw
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                        Let&apos;s get your workspace synced. Connect your tools to start
                        automating your workflow in seconds.
                    </p>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                    <button
                        onClick={() => setActiveForm('notion')}
                        className="w-full h-12 rounded-lg bg-[#FF4500] text-black font-bold hover:bg-[#E63E00] transition-all flex items-center justify-center gap-2 group"
                        style={{
                            boxShadow: '0 0 20px rgba(255, 69, 0, 0.2)',
                        }}
                    >
                        <span className="text-lg">N</span>
                        Connect Notion
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                        onClick={() => setActiveForm('clickup')}
                        className="w-full h-12 rounded-lg bg-[#7B68EE] text-white font-bold hover:bg-[#6A5ACD] transition-all flex items-center justify-center gap-2 group"
                        style={{
                            boxShadow: '0 0 20px rgba(123, 104, 238, 0.2)',
                        }}
                    >
                        <span className="text-lg">C</span>
                        Connect ClickUp
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                        onClick={onSetupManually}
                        className="w-full h-12 rounded-lg border border-[#334155] text-slate-400 font-medium hover:border-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Setup Manually
                    </button>
                </div>

                {/* Divider */}
                <div className="mt-8 pt-6 border-t border-[#334155]">
                    <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                        Step 1 of 3: Workspace Integration
                    </p>
                    <div className="flex justify-center gap-2">
                        <div className="w-8 h-1 rounded-full bg-[#FF4500]" />
                        <div className="w-8 h-1 rounded-full bg-[#334155]" />
                        <div className="w-8 h-1 rounded-full bg-[#334155]" />
                    </div>
                </div>
            </div>

            {/* Skip entirely */}
            <button
                onClick={onSkipAll}
                className="w-full mt-6 text-center text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
                Skip setup and go to dashboard
            </button>
        </div>
    )
}
