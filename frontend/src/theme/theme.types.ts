/**
 * Theme Mode: Controls light/dark appearance
 * - "light": Light color scheme
 * - "dark": Dark color scheme  
 * - "system": Follow OS preference (prefers-color-scheme)
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Resolved Mode: The actual mode applied (never "system")
 * Used for rendering logic and CSS variable selection
 */
export type ResolvedMode = "light" | "dark";

/**
 * Theme Set = a group of tokens per deploy/environment.
 * The mode (light/dark) is chosen by the user (next-themes).
 */
export type ThemeSetName = 
  | "corporate" 
  | "funky" 
  | "blue" 
  | "red"
  | "ocean-blue"
  | "ruby-red"
  | "emerald-green"
  | "amber-gold";

export type CssVarValue = string;

export type ThemeTokens = {
  /**
   * Map of CSS variable tokens, e.g.:
   * - background: "222.2 84% 4.9%"
   * - hero-glow: "#8b5cf6"
   */
  colors: Record<string, CssVarValue>;
  radius: {
    radius: CssVarValue;
  };
};

export type ThemeSet = {
  name: ThemeSetName;
  displayName: string;  // Friendly name for UI
  previewColor: string; // HEX color used for UI previews
  modes: Record<ResolvedMode, ThemeTokens>;  // light/dark only, never "system"
};
