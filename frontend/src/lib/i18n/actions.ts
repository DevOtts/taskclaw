'use server';

import fs from 'fs/promises';
import path from 'path';

export async function loadTranslations(language: string, namespace: string) {
    try {
        const filePath = path.join(process.cwd(), 'public', 'locales', language, `${namespace}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Failed to load translations for ${language}/${namespace}`, error);
        return {};
    }
}
