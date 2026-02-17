import { getSystemSettings } from "../actions";
import { ThemeSelector } from "./ThemeSelector";

export default async function AppearanceSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
          <p className="text-muted-foreground">
            Configure the global theme for all users.
          </p>
        </div>
      </div>

      <ThemeSelector
        currentThemeSet={settings?.theme_set ?? "corporate"}
      />
    </div>
  );
}
