"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

import { useThemePreview } from "./useThemePreview";
import { updateGlobalTheme } from "./actions";
import { ThemePaletteCard } from "./ThemePaletteCard";
import { ThemeModeComparisonPreview } from "./ThemeModeComparisonPreview";
import { THEME_SET_OPTIONS } from "@/theme/themeConfig";
import type { ThemeSetName } from "@/theme/theme.types";

interface ThemeSelectorProps {
  currentThemeSet: string;
}

export function ThemeSelector({ currentThemeSet }: ThemeSelectorProps) {
  const { resolvedTheme } = useTheme();
  const currentMode = (resolvedTheme === "dark" ? "dark" : "light") as "light" | "dark";

  const { isPreviewActive, applyPreview, cancelPreview } = useThemePreview(
    currentThemeSet as ThemeSetName
  );

  const [selectedTheme, setSelectedTheme] = useState(currentThemeSet);
  const [isSaving, setIsSaving] = useState(false);

  // Handler for theme selection
  const handleThemeSelect = (themeSet: string) => {
    setSelectedTheme(themeSet);
    applyPreview(themeSet as ThemeSetName, currentMode);
  };

  // Handler for cancel
  const handleCancel = () => {
    setSelectedTheme(currentThemeSet);
    cancelPreview();
  };

  // Handler for save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateGlobalTheme({
        theme_set: selectedTheme,
      });

      if (result.error) {
        toast.error(result.error);
        cancelPreview();
      } else {
        toast.success("Theme updated globally! All users will see the change.");
        cancelPreview();
      }
    } catch {
      toast.error("Failed to save theme");
      cancelPreview();
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = selectedTheme !== currentThemeSet;

  return (
    <div className="space-y-6">
      {/* Color Palette Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Global Color Palette</CardTitle>
          <CardDescription>
            The primary color used for actions, links, and accents across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {THEME_SET_OPTIONS.map((theme) => (
              <ThemePaletteCard
                key={theme.value}
                label={theme.label}
                previewColor={theme.preview}
                isSelected={selectedTheme === theme.value}
                isActive={currentThemeSet === theme.value}
                onClick={() => handleThemeSelect(theme.value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Light vs Dark Mode Comparison */}
      <ThemeModeComparisonPreview 
        themeSet={selectedTheme as ThemeSetName} 
        isPreviewActive={isPreviewActive}
      />

      {/* Preview Active Banner */}
      {isPreviewActive && (
        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Preview Mode:</strong> Only you can see these changes. 
            Click &quot;Apply Global Theme&quot; to save for all users.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Discard Changes
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Apply Global Theme"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
