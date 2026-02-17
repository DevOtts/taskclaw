import { useState } from "react";
import { createConversation, sendMessage } from "@/app/dashboard/chat/actions";

export function useAiEnhancement() {
    const [isGenerating, setIsGenerating] = useState(false);

    const generate = async (prompt: string, context: string = "", _systemPromptKey?: string) => {
        setIsGenerating(true);
        try {
            const fullPrompt = `Task: Enhance or generate text based on the following instruction.
Instruction: ${prompt}
Context/Current Text: "${context}"

Return ONLY the enhanced text. Do not add conversational filler.`;

            const conversation = await createConversation("AI Enhancement");
            if (conversation.error || !conversation.id) {
                throw new Error(conversation.error || "Failed to create conversation");
            }

            const result = await sendMessage(conversation.id, fullPrompt);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.assistant_message?.content || result.content || "";
        } finally {
            setIsGenerating(false);
        }
    };

    return { generate, isGenerating };
}
