import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiEnhancerTriggerProps {
    onClick: () => void;
    className?: string;
}

export function AiEnhancerTrigger({ onClick, className }: AiEnhancerTriggerProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={cn(
                "absolute top-2 left-2 z-10 h-6 w-6 rounded-full bg-background/80 hover:bg-background shadow-sm border border-input opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100",
                className
            )}
            type="button"
            title="Enhance with AI"
        >
            <Sparkles className="h-3 w-3 text-primary" />
        </Button>
    );
}
