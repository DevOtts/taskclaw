'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
    mode: 'grid' | 'list';
    onChange: (mode: 'grid' | 'list') => void;
    className?: string;
}

export function ViewToggle({ mode, onChange, className }: ViewToggleProps) {
    return (
        <div className={cn("flex items-center gap-1 bg-muted p-1 rounded-md", className)}>
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "h-7 w-7 hover:bg-background hover:text-foreground",
                    mode === 'grid' && "bg-background text-foreground shadow-sm hover:bg-background"
                )}
                onClick={() => onChange('grid')}
                title="Grid view"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "h-7 w-7 hover:bg-background hover:text-foreground",
                    mode === 'list' && "bg-background text-foreground shadow-sm hover:bg-background"
                )}
                onClick={() => onChange('list')}
                title="List view"
            >
                <List className="h-4 w-4" />
            </Button>
        </div>
    );
}
