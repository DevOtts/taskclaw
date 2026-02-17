"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { THEME_SETS } from "@/theme/themeConfig";
import type { ThemeSetName, ResolvedMode } from "@/theme/theme.types";

interface UseThemePreviewReturn {
  previewTheme: ThemeSetName | null;
  isPreviewActive: boolean;
  applyPreview: (themeSet: ThemeSetName, mode: ResolvedMode) => void;
  cancelPreview: () => void;
}

export function useThemePreview(
  initialTheme: ThemeSetName,
): UseThemePreviewReturn {
  const [previewTheme, setPreviewTheme] = useState<ThemeSetName | null>(null);
  const originalValuesRef = useRef<Map<string, string>>(new Map());

  const applyPreview = useCallback(
    (themeSet: ThemeSetName, mode: ResolvedMode) => {
      const root = document.documentElement;
      const tokens = THEME_SETS[themeSet]?.modes[mode];

      if (!tokens) return;

      // Save original values before applying preview (only first time)
      if (originalValuesRef.current.size === 0) {
        const computedStyle = getComputedStyle(root);
        for (const key of Object.keys(tokens.colors)) {
          const currentValue = computedStyle.getPropertyValue(`--${key}`);
          originalValuesRef.current.set(`--${key}`, currentValue);
        }
        // Also save radius
        originalValuesRef.current.set(
          "--radius",
          computedStyle.getPropertyValue("--radius"),
        );
      }

      // Apply new values
      for (const [key, value] of Object.entries(tokens.colors)) {
        root.style.setProperty(`--${key}`, value);
      }
      root.style.setProperty("--radius", tokens.radius.radius);

      setPreviewTheme(themeSet);
    },
    [],
  );

  const cancelPreview = useCallback(() => {
    const root = document.documentElement;

    // Restore original values
    for (const [prop, value] of originalValuesRef.current) {
      root.style.setProperty(prop, value);
    }

    originalValuesRef.current.clear();
    setPreviewTheme(null);
  }, []);

  const isPreviewActive =
    previewTheme !== null && previewTheme !== initialTheme;

  // Cleanup effect: restore original values on unmount if preview is active
  useEffect(() => {
    const originalValues = originalValuesRef.current;
    return () => {
      if (originalValues.size > 0) {
        const root = document.documentElement;
        for (const [prop, value] of originalValues) {
          root.style.setProperty(prop, value);
        }
        originalValues.clear();
      }
    };
  }, []);

  return {
    previewTheme,
    isPreviewActive,
    applyPreview,
    cancelPreview,
  };
}
