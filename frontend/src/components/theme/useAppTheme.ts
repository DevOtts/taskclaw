"use client";

import { useCallback, useMemo } from "react";
import { useTheme } from "next-themes";

import type { ThemeMode, ResolvedMode } from "@/theme/theme.types";

function toResolvedMode(value: string | undefined): ResolvedMode {
  return value === "dark" ? "dark" : "light";
}

export function useAppTheme() {
  const { theme, resolvedTheme, setTheme, systemTheme } = useTheme();

  /**
   * The current mode selected by the user (can be "system")
   */
  const mode = useMemo<ThemeMode>(() => {
    if (theme === "system" || theme === "light" || theme === "dark") {
      return theme;
    }
    return "system";
  }, [theme]);

  /**
   * The resolved mode (always "light" or "dark", never "system")
   * Useful for rendering logic
   */
  const resolvedMode = useMemo<ResolvedMode>(() => {
    return toResolvedMode(resolvedTheme);
  }, [resolvedTheme]);

  /**
   * The operating system preference
   */
  const systemMode = useMemo<ResolvedMode>(() => {
    return toResolvedMode(systemTheme);
  }, [systemTheme]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setTheme(next);
    },
    [setTheme],
  );

  const toggleMode = useCallback(() => {
    // If currently in system, switch to the opposite of the resolved mode.
    // If currently in light/dark, just toggle.
    const targetMode = resolvedMode === "dark" ? "light" : "dark";
    setTheme(targetMode);
  }, [resolvedMode, setTheme]);

  return { 
    mode,           // "light" | "dark" | "system"
    resolvedMode,   // "light" | "dark" (effective)
    systemMode,     // "light" | "dark" (OS preference)
    setMode, 
    toggleMode 
  } as const;
}

