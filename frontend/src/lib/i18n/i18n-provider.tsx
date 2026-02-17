'use client';

import type { InitOptions, i18n } from 'i18next';

import { initializeI18nClient } from './i18n.client';

let i18nInstance: i18n;

type Resolver = (
  lang: string,
  namespace: string,
) => Promise<Record<string, string>>;

import { I18nextProvider } from 'react-i18next';

export function I18nProvider({
  settings,
  children,
  resolver,
  resources,
}: React.PropsWithChildren<{
  settings: InitOptions;
  resolver?: Resolver;
  resources?: Record<string, any>;
}>) {
  const instance = useI18nClient(settings, resolver, resources);

  return (
    <I18nextProvider i18n={instance}>
      {children}
    </I18nextProvider>
  );
}

/**
 * @name useI18nClient
 * @description A hook that initializes the i18n client.
 * @param settings
 * @param resolver
 */
function useI18nClient(settings: InitOptions, resolver?: Resolver, resources?: Record<string, any>) {
  if (
    !i18nInstance ||
    i18nInstance.language !== settings.lng
  ) {
    throw loadI18nInstance(settings, resolver, resources);
  }

  return i18nInstance;
}

async function loadI18nInstance(settings: InitOptions, resolver?: Resolver, resources?: Record<string, any>) {
  i18nInstance = await initializeI18nClient(settings, resolver, resources);
}
