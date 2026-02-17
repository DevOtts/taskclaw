"use client";

import type { ReactNode } from "react";

import type { ThemeSetName } from "@/theme/theme.types";
import { AppThemeProvider } from "@/components/theme/AppThemeProvider";

type ThemeProviderProps = {
  children: ReactNode;
  /**
   * Backwards-compatible wrapper for places still importing `ThemeProvider`.
   * Prefer using `AppThemeProvider` directly (and passing the theme set from server-side env).
   */
  themeSet?: ThemeSetName;
};

export function ThemeProvider({ children, themeSet }: ThemeProviderProps) {
  return <AppThemeProvider themeSet={themeSet}>{children}</AppThemeProvider>;
}
