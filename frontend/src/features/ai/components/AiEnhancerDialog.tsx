import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { useAiEnhancement } from "../hooks/useAiEnhancement";

interface AiEnhancerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentValue: string;
    onApply: (newValue: string) => void;
}

export function AiEnhancerDialog({ open, onOpenChange, currentValue, onApply }: AiEnhancerDialogProps) {
    const [prompt, setPrompt] = useState("");
    const [preview, setPreview] = useState("");
    const { generate, isGenerating } = useAiEnhancement();

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        const result = await generate(prompt, currentValue);
        setPreview(result);
    };

    const handleApply = () => {
        onApply(preview || currentValue); // If no preview, verify if we should just close? No, assumes user generated something. 
        // If preview is empty, maybe they didn't generate anything.
        // Let's assume if preview exists use it.
        onOpenChange(false);
        setPrompt("");
        setPreview("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Assistant
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">What would you like to do with this text?</p>
                        <Input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Fix grammar, Make it more professional..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleGenerate();
                            }}
                        />
                    </div>

                    {(preview || isGenerating) && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Preview:</p>
                            <div className="rounded-md border p-3 min-h-[80px] text-sm bg-muted/50 relative">
                                {isGenerating ? (
                                    <div className="flex items-center justify-center h-full absolute inset-0">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : (
                                    preview
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}>Generate</Button>
                    {preview && (
                        <Button onClick={handleApply}>Apply</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
