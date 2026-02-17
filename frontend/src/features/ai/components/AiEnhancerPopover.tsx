import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiEnhancement } from "../hooks/useAiEnhancement";
import { AiEnhancerTrigger } from "./AiEnhancerTrigger";

interface AiEnhancerPopoverProps {
    currentValue: string;
    onApply: (newValue: string) => void;
    systemPromptKey?: string;
}

export function AiEnhancerPopover({ currentValue, onApply, systemPromptKey }: AiEnhancerPopoverProps) {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [preview, setPreview] = useState("");
    const { generate, isGenerating } = useAiEnhancement();

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        const result = await generate(prompt, currentValue, systemPromptKey);
        setPreview(result);
    };

    const handleApply = () => {
        onApply(preview || currentValue);
        setOpen(false);
        setPrompt("");
        setPreview("");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <AiEnhancerTrigger onClick={() => setOpen(true)} className="relative top-0 left-0 bg-background/50 backdrop-blur-sm" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <div className="flex items-center gap-2 border-b p-3 bg-muted/30">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Magic Editor</span>
                </div>
                <div className="p-3 space-y-3">
                    <div className="flex gap-2">
                        <Input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ask AI to edit this text..."
                            className="h-9"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleGenerate();
                            }}
                            autoFocus
                        />
                        <Button size="sm" onClick={handleGenerate} disabled={!prompt.trim() || isGenerating} className="shrink-0">
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        </Button>
                    </div>

                    {(preview || isGenerating) && (
                        <div className="space-y-2 pt-2">
                            <div className="rounded-md border bg-muted/50 p-3 text-sm relative min-h-[60px]">
                                {isGenerating ? (
                                    <div className="flex items-center gap-2 text-muted-foreground justify-center h-full py-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>Generating...</span>
                                    </div>
                                ) : (
                                    <ScrollArea className="max-h-[200px]">
                                        {preview}
                                    </ScrollArea>
                                )}
                            </div>
                            {preview && (
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => { setPreview(""); setPrompt(""); }}>Discard</Button>
                                    <Button size="sm" onClick={handleApply}>Apply to field</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
