'use client';

import { I18nProvider } from '@/lib/i18n/i18n-provider';
import { getI18nSettings } from '@/lib/i18n/settings';


export function I18nProviderWrapper({
    children,
    resources
}: {
    children: React.ReactNode;
    resources: Record<string, any>;
}) {
    const settings = getI18nSettings();

    return (
        <I18nProvider settings={settings} resources={resources}>
            {children}
        </I18nProvider>
    );
}
