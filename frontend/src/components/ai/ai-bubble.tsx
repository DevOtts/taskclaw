"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"

export function AiBubble() {
    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Link href="/dashboard/ai-assistant">
                <button className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#136dec] to-[#8b5cf6] rounded-full text-white transition-all transform hover:scale-110 active:scale-95 group shadow-xl">
                    {/* Replaced 'auto_awesome' with 'Sparkles' from Lucide */}
                    <Sparkles className="w-7 h-7" />
                    <div className="absolute right-full mr-4 px-3 py-2 bg-[#1c2027] border border-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl">
                        Ask n8n AI Assistant
                        <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#1c2027] border-r border-t border-slate-800 rotate-45"></div>
                    </div>
                </button>
            </Link>
        </div>
    )
}
