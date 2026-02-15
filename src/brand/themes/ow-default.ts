/**
 * Oliver Wyman Default Theme
 *
 * Standard brand theme for digital and web use.
 * NOTE: Color values are PLACEHOLDERS — replace with actual OW brand values.
 */

import type { Theme } from "../types";

export const owDefaultTheme: Theme = {
  id: "ow-default",
  name: "Oliver Wyman",
  description: "Standard OW brand for digital and web use",

  typography: {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", // TODO: Replace with OW brand font
    fontFamilyMono: "'JetBrains Mono', 'Fira Code', monospace",
    title: { size: 18, weight: 700, color: "#1A1A1A", lineHeight: 1.3 },
    subtitle: { size: 13, weight: 400, color: "#666666", lineHeight: 1.4 },
    axisLabel: { size: 12, weight: 500, color: "#555555" },
    axisTick: { size: 11, weight: 400, color: "#777777" },
    dataLabel: { size: 11, weight: 500, color: "#333333" },
    legend: { size: 12, weight: 400, color: "#555555" },
    tooltip: {
      size: 12,
      weight: 400,
      color: "#FFFFFF",
      background: "#1A1A1A",
      border: "none",
      borderRadius: 4,
    },
    footer: { size: 10, weight: 400, color: "#999999" },
  },

  colors: {
    background: "#FFFFFF",
    text: "#1A1A1A",
    textSecondary: "#666666",
    axisLine: "#333333",
    axisTickLine: "#CCCCCC",
    gridLine: "#E8E8E8",
    highlight: "#0082CA", // TODO: Replace with OW accent
    highlightSecondary: "#00B5E2",
    muted: "#D0D0D0",

    palettes: {
      categorical: [
        {
          id: "primary",
          name: "OW Primary",
          description: "Main brand palette — best for up to 6 categories",
          colors: [
            "#00263E",
            "#0082CA",
            "#00B5E2",
            "#7AB800",
            "#F2A900",
            "#E03C31",
          ], // TODO: Replace
          maxCategories: 6,
        },
        {
          id: "extended",
          name: "OW Extended",
          description: "Use for 7–10 categories",
          colors: [
            "#003B5C",
            "#4298B5",
            "#8DC8E8",
            "#B5BD00",
            "#F0AB00",
            "#DA291C",
            "#6D2077",
            "#00A3AD",
            "#CE0058",
            "#7C878E",
          ], // TODO: Replace
          maxCategories: 10,
        },
      ],
      sequential: [
        {
          id: "blue",
          name: "Blue Scale",
          stops: ["#E8F4FD", "#00263E"],
        },
        {
          id: "green",
          name: "Green Scale",
          stops: ["#F0F7E6", "#2D6E00"],
        },
        {
          id: "warm",
          name: "Warm Scale",
          stops: ["#FFF4E0", "#E03C31"],
        },
      ],
      diverging: [
        {
          id: "red-blue",
          name: "Red → Neutral → Blue",
          stops: ["#E03C31", "#F5F5F5", "#0082CA"],
        },
        {
          id: "red-green",
          name: "Red → Neutral → Green",
          stops: ["#E03C31", "#F5F5F5", "#7AB800"],
        },
      ],
    },
  },

  layout: {
    chartPadding: { top: 16, right: 16, bottom: 16, left: 16 },
    plotMargin: { top: 20, right: 30, bottom: 40, left: 50 },
    titleGap: 4,
    subtitleGap: 16,
    legendGap: 16,
    footerGap: 12,
    barGap: 0.2,
    barGroupGap: 0.1,
  },

  axes: {
    strokeWidth: 1,
    tickSize: 5,
    tickPadding: 8,
    gridLineStyle: "dashed",
    gridLineWidth: 1,
    gridLineOpacity: 0.4,
    showXAxis: true,
    showYAxis: true,
    showXGrid: false,
    showYGrid: true,
  },

  responsive: {
    breakpoints: { mobile: 400, tablet: 600, desktop: 900 },
    mobile: {
      typography: {
        title: { size: 15, weight: 700, color: "#1A1A1A", lineHeight: 1.3 },
        subtitle: { size: 11, weight: 400, color: "#666666", lineHeight: 1.4 },
        axisLabel: { size: 10, weight: 500, color: "#555555" },
        axisTick: { size: 9, weight: 400, color: "#777777" },
        dataLabel: { size: 9, weight: 500, color: "#333333" },
      },
      layout: {
        plotMargin: { top: 12, right: 12, bottom: 30, left: 40 },
      },
      labelMode: "legend",
      axisTickCount: 5,
      hiddenElements: ["subtitle"],
    },
  },

  chrome: {
    showTitle: true,
    showSubtitle: true,
    showFooter: true,
    showSource: true,
    showLogo: false, // Enable once logo is provided
    logoPosition: "bottom-right",
    logoSize: { width: 80, height: 24 },
  },
};
