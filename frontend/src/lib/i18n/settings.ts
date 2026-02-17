import { createI18nSettings } from './create-i18n-settings';

export const languages = ['en', 'es', 'de', 'fr', 'it', 'ja', 'zh'];
export const defaultLanguage = 'en';
export const defaultNamespace = 'common';

export function getI18nSettings(
    language: string = defaultLanguage,
    namespaces: string | string[] = defaultNamespace,
) {
    return createI18nSettings({
        languages,
        language,
        namespaces,
    });
}
