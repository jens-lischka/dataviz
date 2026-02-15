/**
 * Theme System Type Definitions
 *
 * Themes control ALL non-data visual properties of charts.
 * They are separate from chart templates (which define behavior).
 *
 * Theme = how it looks (applies to ALL chart types)
 * Template = what it does (specific to each chart type)
 *
 * Key design decisions (inspired by Datawrapper):
 * - Typography is defined per-element (title, axis, labels, etc.)
 * - Color palettes are named and grouped with usage descriptions
 * - Responsive overrides are built into the theme
 * - Chrome elements (title, legend, footer) are configured here
 */

// ─── Typography ──────────────────────────────────────────────────────

export interface TextStyle {
  size: number; // in px
  weight: number; // 100–900
  color: string; // hex
  lineHeight?: number; // multiplier
  transform?: "uppercase" | "lowercase" | "none";
  letterSpacing?: number; // in px
}

// ─── Color Palettes ──────────────────────────────────────────────────

export interface NamedPalette {
  id: string;
  name: string; // e.g., "Primary", "Warm", "Cool"
  description?: string; // e.g., "Use for up to 6 categories"
  colors: string[];
  /** Soft limit: warn if data exceeds this many categories */
  maxCategories?: number;
}

export interface NamedGradient {
  id: string;
  name: string; // e.g., "Blue Scale", "Red–Blue Diverging"
  stops: string[]; // 2 for sequential, 3 for diverging
}

// ─── Main Theme Interface ────────────────────────────────────────────

export interface Theme {
  id: string;
  name: string;
  description: string;

  // --- Typography ---
  typography: {
    fontFamily: string;
    fontFamilyMono?: string;
    title: TextStyle;
    subtitle: TextStyle;
    axisLabel: TextStyle;
    axisTick: TextStyle;
    dataLabel: TextStyle;
    legend: TextStyle;
    tooltip: TextStyle & { background: string; border: string; borderRadius?: number };
    footer: TextStyle;
  };

  // --- Colors ---
  colors: {
    background: string;
    text: string;
    textSecondary: string;
    axisLine: string;
    axisTickLine: string;
    gridLine: string;
    highlight: string;
    highlightSecondary: string;
    muted: string; // for de-emphasized elements on hover

    palettes: {
      categorical: NamedPalette[];
      sequential: NamedGradient[];
      diverging: NamedGradient[];
    };
  };

  // --- Layout & Spacing ---
  layout: {
    /** Outer padding of the entire chart container */
    chartPadding: { top: number; right: number; bottom: number; left: number };
    /** Inner margins around the plot area (space for axes, labels) */
    plotMargin: { top: number; right: number; bottom: number; left: number };
    titleGap: number;
    subtitleGap: number;
    legendGap: number;
    footerGap: number;
    barGap: number; // fraction of bandwidth (0–1)
    barGroupGap: number;
  };

  // --- Axes & Grid ---
  axes: {
    strokeWidth: number;
    tickSize: number;
    tickPadding: number;
    gridLineStyle: "solid" | "dashed" | "dotted" | "none";
    gridLineWidth: number;
    gridLineOpacity: number;
    showXAxis: boolean;
    showYAxis: boolean;
    showXGrid: boolean;
    showYGrid: boolean;
  };

  // --- Responsive Overrides ---
  responsive: {
    breakpoints: {
      mobile: number; // width in px, e.g. 400
      tablet: number; // e.g. 600
      desktop: number; // e.g. 900
    };
    /** Overrides applied when chart width < breakpoints.mobile */
    mobile?: {
      typography?: Partial<Theme["typography"]>;
      layout?: Partial<Theme["layout"]>;
      axes?: Partial<Theme["axes"]>;
      /** Switch from direct data labels to legend-based on mobile */
      labelMode?: "direct" | "legend";
      /** Elements to hide on mobile to save space */
      hiddenElements?: string[];
      /** Reduce tick density on mobile */
      axisTickCount?: number;
    };
  };

  // --- Chrome Elements (title, legend, footer, logo) ---
  chrome: {
    showTitle: boolean;
    showSubtitle: boolean;
    showFooter: boolean;
    showSource: boolean;
    showLogo: boolean;
    logoUrl?: string;
    logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    logoSize: { width: number; height: number };
    border?: {
      width: number;
      color: string;
      position: "top" | "bottom" | "all" | "none";
    };
  };

  // --- Print / Export Overrides ---
  print?: {
    /** Override any theme property for print export */
    typography?: Partial<Theme["typography"]>;
    colors?: Partial<Theme["colors"]>;
    axes?: Partial<Theme["axes"]>;
    /** CMYK equivalents for key brand colors */
    cmykOverrides?: Record<string, { c: number; m: number; y: number; k: number }>;
    /** Minimum font size for print legibility */
    minFontSize?: number;
  };
}

// ─── Theme Utilities ─────────────────────────────────────────────────

/** Breakpoint name derived from width */
export type Breakpoint = "mobile" | "tablet" | "desktop";

/** Partial theme for user overrides */
export type ThemeOverrides = DeepPartial<Theme>;

/** Deep partial utility type */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
