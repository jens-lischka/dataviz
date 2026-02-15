/**
 * Theme Context
 *
 * Provides the active (merged) theme to all components.
 * Components use the useTheme() hook to access theme values.
 *
 * The active theme is: selectedTheme + themeOverrides merged together.
 * Theme overrides take precedence over the base theme values.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Theme, Breakpoint, DeepPartial } from "./types";
import { useAppStore, getActiveTheme } from "@/app/store";

// ─── Context ─────────────────────────────────────────────────────────

const ThemeContext = createContext<Theme | null>(null);

// ─── Provider ────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const baseTheme = useAppStore((state) => getActiveTheme(state));
  const overrides = useAppStore((state) => state.themeOverrides);

  const mergedTheme = useMemo(
    () => deepMerge(baseTheme, overrides) as Theme,
    [baseTheme, overrides]
  );

  return (
    <ThemeContext.Provider value={mergedTheme}>{children}</ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return theme;
}

// ─── Utilities ───────────────────────────────────────────────────────

/**
 * Resolve theme values for a given viewport width.
 * Applies mobile overrides when width < mobile breakpoint.
 */
export function resolveResponsiveTheme(theme: Theme, width: number): Theme {
  if (width >= theme.responsive.breakpoints.mobile) {
    return theme;
  }

  // Apply mobile overrides
  if (theme.responsive.mobile) {
    return deepMerge(theme, {
      typography: theme.responsive.mobile.typography,
      layout: theme.responsive.mobile.layout,
      axes: theme.responsive.mobile.axes,
    }) as Theme;
  }

  return theme;
}

/**
 * Get the breakpoint name for a given width.
 */
export function getBreakpoint(theme: Theme, width: number): Breakpoint {
  if (width < theme.responsive.breakpoints.mobile) return "mobile";
  if (width < theme.responsive.breakpoints.tablet) return "tablet";
  return "desktop";
}

/**
 * Deep merge two objects. Source values override target values.
 * Arrays are replaced, not merged.
 */
export function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (sourceVal === undefined) continue;

    if (
      sourceVal !== null &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = deepMerge(targetVal as object, sourceVal as DeepPartial<typeof targetVal>);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = sourceVal;
    }
  }

  return result;
}
