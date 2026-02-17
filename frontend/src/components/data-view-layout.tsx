'use client';

import { useState } from 'react';
import { ViewToggle } from '@/components/view-toggle';

interface DataViewLayoutProps<T> {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    filters?: React.ReactNode;
    items: T[];
    renderGridItem: (item: T) => React.ReactNode;
    renderTable: (items: T[]) => React.ReactNode;
    emptyState?: React.ReactNode;
    sidebar?: React.ReactNode;
    itemName?: string;
    defaultView?: 'grid' | 'list';
    footer?: React.ReactNode;
    loading?: boolean;
}

export function DataViewLayout<T>({
    title,
    description,
    actions,
    filters,
    items,
    renderGridItem,
    renderTable,
    emptyState,
    sidebar,
    itemName = 'items',
    defaultView = 'grid',
    footer,
    loading
}: DataViewLayoutProps<T>) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);

    return (
        <div className="flex h-full gap-0 -mx-4 -mb-4">
            {sidebar}

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-background">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                        {description && <p className="text-muted-foreground">{description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-background border-b flex items-center gap-4">
                    {filters}

                    <div className="ml-auto flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                            {items.length} {itemName}
                        </div>
                        <ViewToggle mode={viewMode} onChange={setViewMode} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-auto bg-muted/5">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                    ) : items.length === 0 ? (
                        emptyState || (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <p>No {itemName} found.</p>
                            </div>
                        )
                    ) : viewMode === 'grid' ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {items.map((item, index) => (
                                <div key={index} className="h-full">
                                    {renderGridItem(item)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border bg-background">
                            {renderTable(items)}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-4 border-t bg-background">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
