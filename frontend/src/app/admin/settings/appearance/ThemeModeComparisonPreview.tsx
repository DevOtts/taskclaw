"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Check, AlertCircle, Info, Bell, User, Settings } from "lucide-react";
import { THEME_SETS } from "@/theme/themeConfig";
import type { ThemeSetName, ThemeMode, ThemeTokens } from "@/theme/theme.types";

interface ThemeModeComparisonPreviewProps {
  themeSet: ThemeSetName;
  isPreviewActive?: boolean;
}

/**
 * Isolated preview panel that renders UI elements with specific theme tokens
 */
function PreviewPanel({ 
  mode, 
  tokens,
  label,
  icon: Icon,
}: { 
  mode: ThemeMode;
  tokens: ThemeTokens;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const [switchOn, setSwitchOn] = useState(true);
  
  return (
    <div className="flex-1 min-w-0">
      <div 
        className="rounded-xl border p-4 space-y-5"
        style={{
          backgroundColor: `hsl(${tokens.colors.background})`,
          color: `hsl(${tokens.colors.foreground})`,
          borderColor: `hsl(${tokens.colors.border})`,
        }}
      >
        {/* Mode Header */}
        <div 
          className="flex items-center gap-2 pb-3 border-b" 
          style={{ borderColor: `hsl(${tokens.colors.border})` }}
        >
          <Icon className="h-4 w-4" />
          <span className="font-semibold text-sm">{label}</span>
        </div>

        {/* Buttons Section */}
        <div className="space-y-2">
          <Label 
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}
          >
            Buttons
          </Label>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-8 px-3 py-1.5 transition-colors"
              style={{
                backgroundColor: `hsl(${tokens.colors.primary})`,
                color: `hsl(${tokens.colors["primary-foreground"]})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              Primary
            </button>
            <button
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-8 px-3 py-1.5"
              style={{
                backgroundColor: `hsl(${tokens.colors.secondary})`,
                color: `hsl(${tokens.colors["secondary-foreground"]})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              Secondary
            </button>
            <button
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-8 px-3 py-1.5 border"
              style={{
                backgroundColor: "transparent",
                color: `hsl(${tokens.colors.foreground})`,
                borderColor: `hsl(${tokens.colors.input})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              Outline
            </button>
            <button
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-8 px-3 py-1.5"
              style={{
                backgroundColor: `hsl(${tokens.colors.destructive})`,
                color: `hsl(${tokens.colors["destructive-foreground"]})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              Destructive
            </button>
            <button
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-8 px-3 py-1.5"
              style={{
                backgroundColor: "transparent",
                color: `hsl(${tokens.colors.foreground})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              Ghost
            </button>
          </div>
        </div>

        {/* Form Elements Section */}
        <div className="space-y-2">
          <Label 
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}
          >
            Form Elements
          </Label>
          <div className="space-y-3">
            {/* Input with button */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type something..."
                className="flex h-8 flex-1 border px-3 py-1 text-sm shadow-sm placeholder:opacity-50"
                style={{
                  backgroundColor: "transparent",
                  borderColor: `hsl(${tokens.colors.input})`,
                  color: `hsl(${tokens.colors.foreground})`,
                  borderRadius: tokens.radius.radius,
                }}
              />
              <button
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-8 px-3"
                style={{
                  backgroundColor: `hsl(${tokens.colors.primary})`,
                  color: `hsl(${tokens.colors["primary-foreground"]})`,
                  borderRadius: tokens.radius.radius,
                }}
              >
                Submit
              </button>
            </div>
            
            {/* Toggle/Switch */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSwitchOn(!switchOn)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                style={{
                  backgroundColor: switchOn 
                    ? `hsl(${tokens.colors.primary})` 
                    : `hsl(${tokens.colors.input})`,
                }}
              >
                <span
                  className="pointer-events-none block h-4 w-4 rounded-full shadow-lg transition-transform"
                  style={{
                    backgroundColor: `hsl(${tokens.colors.background})`,
                    transform: switchOn ? "translateX(18px)" : "translateX(2px)",
                  }}
                />
              </button>
              <span className="text-sm">Enable notifications</span>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="space-y-2">
          <Label 
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}
          >
            Badges
          </Label>
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `hsl(${tokens.colors.primary})`,
                color: `hsl(${tokens.colors["primary-foreground"]})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              Default
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `hsl(${tokens.colors.secondary})`,
                color: `hsl(${tokens.colors["secondary-foreground"]})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              Secondary
            </span>
            <span
              className="inline-flex items-center border px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "transparent",
                color: `hsl(${tokens.colors.foreground})`,
                borderColor: `hsl(${tokens.colors.border})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              Outline
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `hsl(${tokens.colors.destructive})`,
                color: `hsl(${tokens.colors["destructive-foreground"]})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              Destructive
            </span>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="space-y-2">
          <Label 
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}
          >
            Alerts
          </Label>
          <div className="space-y-2">
            {/* Info Alert */}
            <div 
              className="flex items-start gap-2 p-3 border text-sm"
              style={{
                backgroundColor: `hsl(${tokens.colors.muted})`,
                borderColor: `hsl(${tokens.colors.border})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: `hsl(${tokens.colors.primary})` }} />
              <div>
                <p className="font-medium">Information</p>
                <p className="text-xs" style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}>
                  This is an informational message.
                </p>
              </div>
            </div>
            
            {/* Destructive Alert */}
            <div 
              className="flex items-start gap-2 p-3 border text-sm"
              style={{
                backgroundColor: mode === "dark" ? "hsl(0 62% 15%)" : "hsl(0 86% 97%)",
                borderColor: `hsl(${tokens.colors.destructive})`,
                color: mode === "dark" ? "hsl(0 86% 90%)" : `hsl(${tokens.colors.destructive})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-xs opacity-80">
                  Something went wrong with your request.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card Section */}
        <div className="space-y-2">
          <Label 
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}
          >
            Card
          </Label>
          <div 
            className="border p-3 space-y-2"
            style={{
              backgroundColor: `hsl(${tokens.colors.card})`,
              color: `hsl(${tokens.colors["card-foreground"]})`,
              borderColor: `hsl(${tokens.colors.border})`,
              borderRadius: tokens.radius.radius,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Project Settings</p>
              <Settings className="h-4 w-4" style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }} />
            </div>
            <p 
              className="text-xs"
              style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}
            >
              Manage your project configuration and preferences.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                className="inline-flex items-center justify-center text-xs font-medium h-7 px-2.5"
                style={{
                  backgroundColor: `hsl(${tokens.colors.primary})`,
                  color: `hsl(${tokens.colors["primary-foreground"]})`,
                  borderRadius: tokens.radius.radius,
                }}
              >
                Configure
              </button>
              <button
                className="inline-flex items-center justify-center text-xs font-medium h-7 px-2.5 border"
                style={{
                  backgroundColor: "transparent",
                  color: `hsl(${tokens.colors.foreground})`,
                  borderColor: `hsl(${tokens.colors.input})`,
                  borderRadius: tokens.radius.radius,
                }}
              >
                Learn more
              </button>
            </div>
          </div>
        </div>

        {/* Table Preview */}
        <div className="space-y-2">
          <Label 
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}
          >
            Table
          </Label>
          <div 
            className="border overflow-hidden"
            style={{
              borderColor: `hsl(${tokens.colors.border})`,
              borderRadius: tokens.radius.radius,
            }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: `hsl(${tokens.colors.muted})` }}>
                  <th className="text-left p-2 font-medium">Name</th>
                  <th className="text-left p-2 font-medium">Email</th>
                  <th className="text-center p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: `1px solid hsl(${tokens.colors.border})` }}>
                  <td className="p-2">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }} />
                      <span>John Doe</span>
                    </div>
                  </td>
                  <td className="p-2" style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}>john@example.com</td>
                  <td className="p-2 text-center">
                    <span 
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs"
                      style={{
                        backgroundColor: mode === "dark" ? "hsl(142 50% 15%)" : "hsl(142 76% 94%)",
                        color: mode === "dark" ? "hsl(142 76% 70%)" : "hsl(142 76% 30%)",
                        borderRadius: tokens.radius.radius,
                      }}
                    >
                      <Check className="h-2.5 w-2.5" />
                      Active
                    </span>
                  </td>
                </tr>
                <tr style={{ borderTop: `1px solid hsl(${tokens.colors.border})` }}>
                  <td className="p-2">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }} />
                      <span>Jane Smith</span>
                    </div>
                  </td>
                  <td className="p-2" style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}>jane@example.com</td>
                  <td className="p-2 text-center">
                    <span 
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs"
                      style={{
                        backgroundColor: mode === "dark" ? "hsl(45 80% 15%)" : "hsl(45 93% 94%)",
                        color: mode === "dark" ? "hsl(45 93% 70%)" : "hsl(45 93% 30%)",
                        borderRadius: tokens.radius.radius,
                      }}
                    >
                      Pending
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Preview */}
        <div className="space-y-2">
          <Label 
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}
          >
            Sidebar
          </Label>
          <div 
            className="border p-2 space-y-1"
            style={{
              backgroundColor: `hsl(${tokens.colors.sidebar})`,
              color: `hsl(${tokens.colors["sidebar-foreground"]})`,
              borderColor: `hsl(${tokens.colors["sidebar-border"]})`,
              borderRadius: tokens.radius.radius,
            }}
          >
            <div 
              className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: `hsl(${tokens.colors["sidebar-primary"]})`,
                color: `hsl(${tokens.colors["sidebar-primary-foreground"]})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </div>
            <div 
              className="flex items-center gap-2 px-2 py-1.5 text-xs"
              style={{
                backgroundColor: `hsl(${tokens.colors["sidebar-accent"]})`,
                color: `hsl(${tokens.colors["sidebar-accent-foreground"]})`,
                borderRadius: tokens.radius.radius,
              }}
            >
              <User className="h-3.5 w-3.5" />
              <span>Profile</span>
            </div>
            <div 
              className="flex items-center gap-2 px-2 py-1.5 text-xs"
              style={{ color: `hsl(${tokens.colors["sidebar-foreground"]})` }}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Notifications</span>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-2">
          <Label 
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}
          >
            Color Palette
          </Label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { name: "Primary", color: tokens.colors.primary },
              { name: "Secondary", color: tokens.colors.secondary },
              { name: "Accent", color: tokens.colors.accent },
              { name: "Muted", color: tokens.colors.muted },
              { name: "Destructive", color: tokens.colors.destructive },
              { name: "Border", color: tokens.colors.border },
              { name: "Ring", color: tokens.colors.ring },
              { name: "Background", color: tokens.colors.background },
            ].map((item) => (
              <div key={item.name} className="text-center">
                <div 
                  className="h-6 w-full border mb-1"
                  style={{
                    backgroundColor: `hsl(${item.color})`,
                    borderColor: `hsl(${tokens.colors.border})`,
                    borderRadius: "4px",
                  }}
                />
                <span className="text-[10px]" style={{ color: `hsl(${tokens.colors["muted-foreground"]})` }}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeModeComparisonPreview({ themeSet, isPreviewActive }: ThemeModeComparisonPreviewProps) {
  const theme = THEME_SETS[themeSet];
  
  if (!theme) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <span>/</span>
          <Moon className="h-4 w-4" />
          Live Preview
          {isPreviewActive && (
            <Badge variant="outline" className="ml-2 text-yellow-600 border-yellow-400">
              Preview Mode
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare how <strong>{theme.displayName}</strong> looks in both light and dark modes side by side.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4">
          <PreviewPanel 
            mode="light" 
            tokens={theme.modes.light}
            label="Light Mode"
            icon={Sun}
          />
          <PreviewPanel 
            mode="dark" 
            tokens={theme.modes.dark}
            label="Dark Mode"
            icon={Moon}
          />
        </div>
      </CardContent>
    </Card>
  );
}
