/**
 * Application State (Zustand Store)
 *
 * Central state for the entire 5-step workflow.
 * All step components read/write through this store.
 */

import { create } from "zustand";
import type { DataRow, ColumnMeta, MappingConfig, MappedData } from "@/charts/types";
import type { Theme, ThemeOverrides } from "@/brand/types";
import { owDefaultTheme } from "@/brand/themes/ow-default";
import { neutralTheme } from "@/brand/themes/neutral";

// ─── Available Themes ────────────────────────────────────────────────

export const availableThemes: Theme[] = [owDefaultTheme, neutralTheme];

// ─── Store Types ─────────────────────────────────────────────────────

export type DataSource = "paste" | "file" | "sample";
export type ExportFormat = "svg" | "png" | "d3-standalone" | "react-component";
export type PreviewBreakpoint = "mobile" | "tablet" | "desktop" | "responsive";

export interface AppState {
  // --- Navigation ---
  currentStep: number; // 1–5
  maxReachedStep: number; // Furthest step the user has reached

  // --- Step 1: Data Input ---
  rawData: string | null;
  parsedData: DataRow[] | null;
  columns: ColumnMeta[] | null;
  dataSource: DataSource | null;
  fileName: string | null;

  // --- Step 2: Chart Selection ---
  selectedChartId: string | null;

  // --- Step 3: Mapping ---
  mapping: MappingConfig;

  // --- Step 4: Customization ---
  visualOptions: Record<string, unknown>;
  selectedThemeId: string;
  themeOverrides: ThemeOverrides;
  previewBreakpoint: PreviewBreakpoint;
  previewWidth: number;
  chartTitle: string;
  chartSubtitle: string;
  chartSource: string;
  chartNotes: string;

  // --- Step 5: Export ---
  exportFormat: ExportFormat;
  exportResponsive: boolean;
  exportWidth: number;
  exportHeight: number;
  exportScale: 1 | 2 | 3;

  // --- Derived ---
  mappedData: MappedData | null;

  // --- Actions ---
  goToStep: (step: number) => void;
  setData: (raw: string, parsed: DataRow[], columns: ColumnMeta[], source: DataSource, fileName?: string) => void;
  clearData: () => void;
  selectChart: (chartId: string) => void;
  setMapping: (dimensionId: string, columnNames: string | string[]) => void;
  clearMapping: (dimensionId: string) => void;
  resetMapping: () => void;
  setMappedData: (data: MappedData) => void;
  setVisualOption: (optionId: string, value: unknown) => void;
  resetVisualOptions: () => void;
  setTheme: (themeId: string) => void;
  setThemeOverride: (path: string, value: unknown) => void;
  resetThemeOverrides: () => void;
  setPreviewBreakpoint: (bp: PreviewBreakpoint) => void;
  setPreviewWidth: (width: number) => void;
  setChartTitle: (title: string) => void;
  setChartSubtitle: (subtitle: string) => void;
  setChartSource: (source: string) => void;
  setChartNotes: (notes: string) => void;
  setExportFormat: (format: ExportFormat) => void;
  setExportDimensions: (width: number, height: number) => void;
  setExportScale: (scale: 1 | 2 | 3) => void;
  setExportResponsive: (responsive: boolean) => void;
  reset: () => void;
}

// ─── Initial State ───────────────────────────────────────────────────

const initialState = {
  currentStep: 1,
  maxReachedStep: 1,
  rawData: null,
  parsedData: null,
  columns: null,
  dataSource: null,
  fileName: null,
  selectedChartId: null,
  mapping: {} as MappingConfig,
  visualOptions: {} as Record<string, unknown>,
  selectedThemeId: "ow-default",
  themeOverrides: {} as ThemeOverrides,
  previewBreakpoint: "desktop" as PreviewBreakpoint,
  previewWidth: 800,
  chartTitle: "",
  chartSubtitle: "",
  chartSource: "",
  chartNotes: "",
  exportFormat: "svg" as ExportFormat,
  exportResponsive: true,
  exportWidth: 800,
  exportHeight: 500,
  exportScale: 2 as 1 | 2 | 3,
  mappedData: null,
};

// ─── Store ───────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  goToStep: (step) =>
    set((state) => ({
      currentStep: step,
      maxReachedStep: Math.max(state.maxReachedStep, step),
    })),

  setData: (raw, parsed, columns, source, fileName) =>
    set({
      rawData: raw,
      parsedData: parsed,
      columns,
      dataSource: source,
      fileName: fileName ?? null,
      // Auto-advance to step 2
      currentStep: 2,
      maxReachedStep: 2,
    }),

  clearData: () =>
    set({
      rawData: null,
      parsedData: null,
      columns: null,
      dataSource: null,
      fileName: null,
      selectedChartId: null,
      mapping: {},
      mappedData: null,
      currentStep: 1,
      maxReachedStep: 1,
    }),

  selectChart: (chartId) =>
    set((state) => ({
      selectedChartId: chartId,
      mapping: {},
      mappedData: null,
      visualOptions: {},
      currentStep: 3,
      maxReachedStep: Math.max(state.maxReachedStep, 3),
    })),

  setMapping: (dimensionId, columnNames) =>
    set((state) => ({
      mapping: { ...state.mapping, [dimensionId]: columnNames },
    })),

  clearMapping: (dimensionId) =>
    set((state) => {
      const next = { ...state.mapping };
      delete next[dimensionId];
      return { mapping: next, mappedData: null };
    }),

  resetMapping: () => set({ mapping: {}, mappedData: null }),

  setMappedData: (data) => set({ mappedData: data }),

  setVisualOption: (optionId, value) =>
    set((state) => ({
      visualOptions: { ...state.visualOptions, [optionId]: value },
    })),

  resetVisualOptions: () => set({ visualOptions: {} }),

  setTheme: (themeId) =>
    set({
      selectedThemeId: themeId,
      themeOverrides: {}, // Reset overrides when switching themes
    }),

  setThemeOverride: (path, value) =>
    set((state) => {
      // Deep set a value at a dot-separated path, e.g. "typography.title.size"
      const parts = path.split(".");
      const overrides = structuredClone(state.themeOverrides) as Record<string, unknown>;
      let current: Record<string, unknown> = overrides;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current) || typeof current[parts[i]] !== "object") {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = value;
      return { themeOverrides: overrides as ThemeOverrides };
    }),

  resetThemeOverrides: () => set({ themeOverrides: {} }),

  setPreviewBreakpoint: (bp) => set({ previewBreakpoint: bp }),
  setPreviewWidth: (width) => set({ previewWidth: width }),
  setChartTitle: (title) => set({ chartTitle: title }),
  setChartSubtitle: (subtitle) => set({ chartSubtitle: subtitle }),
  setChartSource: (source) => set({ chartSource: source }),
  setChartNotes: (notes) => set({ chartNotes: notes }),
  setExportFormat: (format) => set({ exportFormat: format }),
  setExportDimensions: (width, height) => set({ exportWidth: width, exportHeight: height }),
  setExportScale: (scale) => set({ exportScale: scale }),
  setExportResponsive: (responsive) => set({ exportResponsive: responsive }),

  reset: () => set(initialState),
}));

// ─── Selectors ───────────────────────────────────────────────────────

/** Get the active theme object (not just the ID) */
export const getActiveTheme = (state: AppState): Theme => {
  return (
    availableThemes.find((t) => t.id === state.selectedThemeId) ?? owDefaultTheme
  );
};
