import type { ThemeSet, ThemeSetName } from "@/theme/theme.types";
import { corporateThemeSet } from "@/theme/sets/corporate";
import { funkyThemeSet } from "@/theme/sets/funky";
import { blueThemeSet } from "@/theme/sets/blue";
import { redThemeSet } from "@/theme/sets/red";
import { oceanBlueThemeSet } from "@/theme/sets/ocean-blue";
import { rubyRedThemeSet } from "@/theme/sets/ruby-red";
import { emeraldGreenThemeSet } from "@/theme/sets/emerald-green";
import { amberGoldThemeSet } from "@/theme/sets/amber-gold";

export const DEFAULT_THEME_SET: ThemeSetName = "corporate";

export const THEME_SETS: Record<ThemeSetName, ThemeSet> = {
  corporate: corporateThemeSet,
  funky: funkyThemeSet,
  blue: blueThemeSet,
  red: redThemeSet,
  "ocean-blue": oceanBlueThemeSet,
  "ruby-red": rubyRedThemeSet,
  "emerald-green": emeraldGreenThemeSet,
  "amber-gold": amberGoldThemeSet,
};

// Metadata for theme selection UI
export const THEME_SET_OPTIONS = [
  { value: "ocean-blue" as const, label: "Ocean Blue", preview: "#2563eb" },
  { value: "ruby-red" as const, label: "Ruby Red", preview: "#dc2626" },
  { value: "emerald-green" as const, label: "Forest Green", preview: "#059669" },
  { value: "funky" as const, label: "Royal Purple", preview: "#9333ea" },
  { value: "amber-gold" as const, label: "Sunset Amber", preview: "#d97706" },
  { value: "blue" as const, label: "Deep Indigo", preview: "#3b82f6" },
  { value: "corporate" as const, label: "Corporate", preview: "#1e293b" },
  { value: "red" as const, label: "Bold Red", preview: "#ef4444" },
];

export function getThemeSet(name: string | undefined): ThemeSetName {
  const normalized = (name ?? "").trim().toLowerCase();

  if (
    normalized &&
    Object.prototype.hasOwnProperty.call(
      THEME_SETS,
      normalized as ThemeSetName,
    )
  ) {
    return normalized as ThemeSetName;
  }

  return DEFAULT_THEME_SET;
}

