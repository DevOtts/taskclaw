import * as React from "react"
import { Command, GalleryVerticalEnd, AudioWaveform } from "lucide-react"

import { cn } from "@/lib/utils"

// Mapping for dynamic icon selection
const ICONS: Record<string, React.ElementType> = {
    Command,
    GalleryVerticalEnd,
    AudioWaveform,
}

interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "horizontal" | "square"
    name?: string
    logo?: React.ElementType
}

export function BrandLogo({
    className,
    variant = "square",
    // Allow props to override, but fallback to env vars, then defaults
    name,
    logo,
    ...props
}: BrandLogoProps) {
    const envBrandName = process.env.NEXT_PUBLIC_BRAND_NAME
    const envLogoType = process.env.NEXT_PUBLIC_LOGO_TYPE
    const envIconName = process.env.NEXT_PUBLIC_BRAND_ICON_LOGO
    const envImagePath = process.env.NEXT_PUBLIC_BRAND_IMAGE_PATH

    const finalName = name || envBrandName || "Acme Corp"

    // Determine which Logo component to use (if icon mode)
    let LogoComponent = logo || Command
    if (!logo && envLogoType === "icon" && envIconName && ICONS[envIconName]) {
        LogoComponent = ICONS[envIconName]
    }

    const isImageMode = envLogoType === "image"
    // Default to logo.svg if image path not specified but mode is image
    const imagePath = envImagePath || "/images/logo/logo.svg"

    if (isImageMode) {
        return (
            <div className={cn("px-2 py-2 mb-2", className)} {...props}>
                <img
                    src={imagePath}
                    alt={finalName}
                    className="w-full h-auto object-contain max-h-10"
                />
            </div>
        )
    }

    if (variant === "horizontal") {
        return (
            <div className={cn("flex items-center gap-2 px-2 py-2", className)} {...props}>
                <div className="flex h-8 w-full items-center justify-start">
                    <LogoComponent className="mr-2 size-6" />
                    <span className="text-lg font-bold truncate">{finalName}</span>
                </div>
            </div>
        )
    }

    // Square variant
    return (
        <div className={cn("flex items-center gap-2 px-2 py-2", className)} {...props}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LogoComponent className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-base">
                    {finalName}
                </span>
            </div>
        </div>
    )
}
