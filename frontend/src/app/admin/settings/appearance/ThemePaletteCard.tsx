"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface ThemePaletteCardProps {
  label: string;
  previewColor: string;
  isSelected: boolean;
  isActive: boolean;
  onClick: () => void;
}

export function ThemePaletteCard({
  label,
  previewColor,
  isSelected,
  isActive,
  onClick,
}: ThemePaletteCardProps) {
  return (
    <Card
      className={`
        relative p-4 cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-primary/50
        ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}
      `}
      onClick={onClick}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}

      {/* Color preview */}
      <div
        className="w-full h-16 rounded-md mb-3 transition-transform hover:scale-105"
        style={{ backgroundColor: previewColor }}
      />

      {/* Theme name */}
      <p className="text-sm font-medium text-center mb-2">{label}</p>

      {/* Status badge */}
      {isActive && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs">
            Active
          </Badge>
        </div>
      )}
    </Card>
  );
}
