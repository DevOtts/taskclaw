'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useUpdateBoard } from '@/hooks/use-boards'
import type { Board } from '@/types/board'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
]

interface BoardSettingsFormProps {
    board: Board
}

export function BoardSettingsForm({ board }: BoardSettingsFormProps) {
    const updateBoard = useUpdateBoard()
    const [name, setName] = useState(board.name)
    const [description, setDescription] = useState(board.description || '')
    const [color, setColor] = useState(board.color || PRESET_COLORS[0])
    const [icon, setIcon] = useState(board.icon || '')
    const [tags, setTags] = useState(board.tags?.join(', ') || '')

    const handleSave = async () => {
        if (!name.trim()) return

        try {
            const result = await updateBoard.mutateAsync({
                id: board.id,
                name: name.trim(),
                description: description.trim() || undefined,
                color,
                icon: icon || undefined,
                tags: tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
            } as any)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Board updated')
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update board')
        }
    }

    return (
        <div className="space-y-5">
            {/* Name */}
            <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Board Name
                </Label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            {/* Description */}
            <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Description
                </Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                    className="resize-none"
                />
            </div>

            {/* Color + Icon */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Color
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className="w-6 h-6 rounded-full border-2 transition-all"
                                style={{
                                    backgroundColor: c,
                                    borderColor: color === c ? 'white' : 'transparent',
                                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Icon (emoji)
                    </Label>
                    <Input
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="e.g. 📋, 🚀, 🎯"
                        maxLength={2}
                    />
                </div>
            </div>

            {/* Tags */}
            <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Tags (comma-separated)
                </Label>
                <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. sprint, marketing, dev"
                />
            </div>

            {/* Save */}
            <Button
                onClick={handleSave}
                disabled={!name.trim() || updateBoard.isPending}
            >
                {updateBoard.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
            </Button>
        </div>
    )
}
