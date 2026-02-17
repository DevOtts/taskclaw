"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@kit/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kit/ui/dropdown-menu";

import { useAppTheme } from "@/components/theme/useAppTheme";
import type { ThemeMode } from "@/theme/theme.types";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const satisfies ReadonlyArray<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}>;

const ThemeToggle = () => {
  const { setMode } = useAppTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="focus-visible:ring-0">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setMode(theme.value)}
          >
            <theme.icon className="mr-2 h-4 w-4" />
            <span>{theme.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
