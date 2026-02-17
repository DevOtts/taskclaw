import { THEME_SETS } from "@/theme/themeConfig";
import type { ThemeSetName } from "@/theme/theme.types";

interface Props {
  themeSet: ThemeSetName;
  // themeMode removed - mode is now client-side only (localStorage)
}

/**
 * Generates CSS variables for both modes (light and dark).
 * The effective mode is determined by the `.dark` class on `<html>`.
 */
function generateCssVariables(themeSet: ThemeSetName): string {
  const theme = THEME_SETS[themeSet];
  if (!theme) return "";

  const lightTokens = theme.modes.light;
  const darkTokens = theme.modes.dark;

  let css = ":root {\n";
  for (const [key, value] of Object.entries(lightTokens.colors)) {
    css += `  --${key}: ${value};\n`;
  }
  css += `  --radius: ${lightTokens.radius.radius};\n`;
  css += "}\n\n";

  css += ".dark {\n";
  for (const [key, value] of Object.entries(darkTokens.colors)) {
    css += `  --${key}: ${value};\n`;
  }
  css += `  --radius: ${darkTokens.radius.radius};\n`;
  css += "}\n";

  return css;
}

export function GlobalThemeInjector({ themeSet }: Props) {
  const cssVariables = generateCssVariables(themeSet);

  return (
    <style
      id="global-theme-variables"
      dangerouslySetInnerHTML={{ __html: cssVariables }}
    />
  );
}
