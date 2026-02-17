"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

import type { ResolvedMode, ThemeSetName, ThemeTokens } from "@/theme/theme.types";
import { THEME_SETS } from "@/theme/themeConfig";
import { THEME_MODE_STORAGE_KEY } from "@/theme/theme.constants";

type AppThemeProviderProps = {
  children: ReactNode;
  /**
   * Optional theme set to inject via CSS variables.
   * When omitted, the provider only manages light/dark mode via next-themes.
   */
  themeSet?: ThemeSetName;
};

function isResolvedMode(value: unknown): value is ResolvedMode {
  return value === "light" || value === "dark";
}

function applyTokensToRoot(tokens: ThemeTokens) {
  const root = document.documentElement;

  for (const [key, value] of Object.entries(tokens.colors)) {
    root.style.setProperty(`--${key}`, value);
  }

  root.style.setProperty("--radius", tokens.radius.radius);
}

function ThemeSetInjector(props: { themeSet?: ThemeSetName }) {
  const { resolvedTheme } = useTheme();

  // resolvedTheme is always "light" or "dark" (never "system")
  const mode = useMemo<ResolvedMode>(() => {
    return isResolvedMode(resolvedTheme) ? resolvedTheme : "light";
  }, [resolvedTheme]);

  useEffect(() => {
    if (!props.themeSet) return;
    const tokens = THEME_SETS[props.themeSet].modes[mode];
    applyTokensToRoot(tokens);
  }, [mode, props.themeSet]);

  return null;
}

export function AppThemeProvider({ children, themeSet }: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      themes={["light", "dark", "system"]}
      storageKey={THEME_MODE_STORAGE_KEY}
    >
      <ThemeSetInjector themeSet={themeSet} />
      {children}
    </NextThemesProvider>
  );
}

