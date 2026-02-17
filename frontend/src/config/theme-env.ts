import type { ThemeSetName } from "@/theme/theme.types";
import { DEFAULT_THEME_SET, THEME_SETS, getThemeSet } from "@/theme/themeConfig";

/**
 * Server-only helper: resolves the active Theme Set from env var (no NEXT_PUBLIC_*).
 */
export function getThemeSetFromEnv(): ThemeSetName {
  const raw = process.env.APP_THEME_NAME;
  const normalized = (raw ?? "").trim().toLowerCase();

  // Minimal observability (server-only) for invalid env values.
  if (raw && !Object.prototype.hasOwnProperty.call(THEME_SETS, normalized)) {
    console.warn(
      `[theme] Invalid APP_THEME_NAME="${raw}", falling back to "${DEFAULT_THEME_SET}"`,
    );
  }

  return getThemeSet(raw);
}

