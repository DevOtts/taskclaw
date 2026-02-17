import * as React from "react"

import { cn } from "@/lib/utils"
import { AiEnhancerPopover } from "@/features/ai/components/AiEnhancerPopover"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  ai?: "enable" | "disable";
  aiPrompt?: string;
}

function Textarea({ className, ai, aiPrompt, value, onChange, ...props }: TextareaProps) {

  const handleAiApply = (newValue: string) => {
    if (onChange) {
      const event = {
        target: { value: newValue },
        currentTarget: { value: newValue }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(event);
    }
  };

  const showAi = ai === "enable";

  return (
    <div className={cn("relative group", showAi ? "w-full" : "")}>
      <textarea
        data-slot="textarea"
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          showAi ? "pl-10" : "",
          className
        )}
        value={value}
        onChange={onChange}
        {...props}
      />
      {showAi && (
        <AiEnhancerPopover
          currentValue={String(value || "")}
          onApply={handleAiApply}
          systemPromptKey={aiPrompt}
        />
      )}
    </div>
  )
}

export { Textarea }
