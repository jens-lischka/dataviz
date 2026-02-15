/**
 * Neutral Theme
 *
 * Clean, unbranded theme for non-brand-specific use cases.
 * Uses a subtle warm gray palette with system fonts.
 */

import type { Theme } from "../types";

export const neutralTheme: Theme = {
  id: "neutral",
  name: "Neutral",
  description: "Clean, unbranded theme with warm grays",

  typography: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontFamilyMono: "ui-monospace, 'SF Mono', monospace",
    title: { size: 16, weight: 600, color: "#1f2937", lineHeight: 1.3 },
    subtitle: { size: 13, weight: 400, color: "#6b7280", lineHeight: 1.4 },
    axisLabel: { size: 11, weight: 500, color: "#4b5563" },
    axisTick: { size: 10, weight: 400, color: "#9ca3af" },
    dataLabel: { size: 10, weight: 500, color: "#374151" },
    legend: { size: 11, weight: 400, color: "#6b7280" },
    tooltip: {
      size: 12,
      weight: 400,
      color: "#f9fafb",
      background: "#1f2937",
      border: "none",
      borderRadius: 6,
    },
    footer: { size: 10, weight: 400, color: "#9ca3af" },
  },

  colors: {
    background: "#FFFFFF",
    text: "#1f2937",
    textSecondary: "#6b7280",
    axisLine: "#d1d5db",
    axisTickLine: "#e5e7eb",
    gridLine: "#f3f4f6",
    highlight: "#3b82f6",
    highlightSecondary: "#60a5fa",
    muted: "#e5e7eb",

    palettes: {
      categorical: [
        {
          id: "default",
          name: "Default",
          description: "Balanced palette for general use",
          colors: [
            "#3b82f6",
            "#ef4444",
            "#10b981",
            "#f59e0b",
            "#8b5cf6",
            "#ec4899",
            "#06b6d4",
            "#84cc16",
          ],
          maxCategories: 8,
        },
        {
          id: "muted",
          name: "Muted",
          description: "Softer tones for professional documents",
          colors: [
            "#6366f1",
            "#f97316",
            "#14b8a6",
            "#a855f7",
            "#f43f5e",
            "#0ea5e9",
          ],
          maxCategories: 6,
        },
      ],
      sequential: [
        { id: "gray", name: "Gray Scale", stops: ["#f3f4f6", "#1f2937"] },
        { id: "blue", name: "Blue Scale", stops: ["#eff6ff", "#1e40af"] },
        { id: "green", name: "Green Scale", stops: ["#f0fdf4", "#166534"] },
      ],
      diverging: [
        {
          id: "red-blue",
          name: "Red → Gray → Blue",
          stops: ["#ef4444", "#f3f4f6", "#3b82f6"],
        },
      ],
    },
  },

  layout: {
    chartPadding: { top: 12, right: 12, bottom: 12, left: 12 },
    plotMargin: { top: 16, right: 24, bottom: 36, left: 48 },
    titleGap: 2,
    subtitleGap: 12,
    legendGap: 12,
    footerGap: 10,
    barGap: 0.25,
    barGroupGap: 0.15,
  },

  axes: {
    strokeWidth: 1,
    tickSize: 4,
    tickPadding: 6,
    gridLineStyle: "solid",
    gridLineWidth: 1,
    gridLineOpacity: 0.5,
    showXAxis: true,
    showYAxis: true,
    showXGrid: false,
    showYGrid: true,
  },

  responsive: {
    breakpoints: { mobile: 400, tablet: 600, desktop: 900 },
    mobile: {
      typography: {
        title: { size: 14, weight: 600, color: "#1f2937", lineHeight: 1.3 },
        axisTick: { size: 9, weight: 400, color: "#9ca3af" },
        dataLabel: { size: 9, weight: 500, color: "#374151" },
      },
      layout: {
        plotMargin: { top: 10, right: 10, bottom: 28, left: 36 },
      },
      labelMode: "legend",
      axisTickCount: 4,
    },
  },

  chrome: {
    showTitle: true,
    showSubtitle: true,
    showFooter: true,
    showSource: true,
    showLogo: false,
    logoPosition: "bottom-right",
    logoSize: { width: 60, height: 18 },
  },
};
