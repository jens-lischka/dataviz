/**
 * Chart Template Type Definitions
 *
 * Every chart type in the application implements the ChartTemplate interface.
 * This is the core abstraction that enables the template system:
 * - Charts are self-contained modules
 * - The UI auto-generates controls from dimension and option definitions
 * - Themes are applied uniformly via the render function's theme parameter
 * - Code generation is a separate path from rendering
 */

import type { Theme } from "@/brand/types";

// ─── Data Types ──────────────────────────────────────────────────────

export type DataType = "string" | "number" | "date" | "boolean";
export type AggregationType = "sum" | "mean" | "median" | "count" | "min" | "max";
export type ChartCategory =
  | "comparison"
  | "distribution"
  | "composition"
  | "relationship"
  | "temporal"
  | "hierarchy";

// ─── Parsed Data ─────────────────────────────────────────────────────

/** A single row of parsed tabular data */
export type DataRow = Record<string, string | number | boolean | Date | null>;

/** Metadata about a column, detected during parsing */
export interface ColumnMeta {
  name: string;
  detectedType: DataType;
  /** User can override the detected type */
  confirmedType: DataType;
  uniqueValues: number;
  nullCount: number;
  sampleValues: (string | number | boolean | Date | null)[];
  /** Only for number columns */
  min?: number;
  max?: number;
  mean?: number;
  /** Only for date columns */
  minDate?: Date;
  maxDate?: Date;
}

// ─── Mapping ─────────────────────────────────────────────────────────

/** User's mapping of data columns to chart dimensions */
export type MappingConfig = Record<string, string | string[]>;

/** Data after applying mapping + transformation, ready for rendering */
export type MappedData = Record<string, unknown>[];

// ─── Dimension Definitions ───────────────────────────────────────────

/**
 * Defines a "slot" in the chart that accepts data columns.
 * The UI generates drag-and-drop targets from these definitions.
 */
export interface DimensionDefinition {
  /** Internal ID, e.g., "x", "y", "color", "size" */
  id: string;
  /** Human-readable label, e.g., "X Axis (Categories)" */
  name: string;
  /** Tooltip description for users */
  description: string;
  /** Must the user fill this slot? */
  required: boolean;
  /** Which column types can be dropped here */
  acceptedTypes: DataType[];
  /** Can multiple columns be mapped to this dimension? */
  multiple: boolean;
  /** Default aggregation when multiple values exist per group */
  defaultAggregation?: AggregationType;
}

// ─── Visual Options ──────────────────────────────────────────────────

/**
 * Defines a configurable visual option for a chart type.
 * The UI auto-generates controls from these definitions.
 */
export interface VisualOptionDefinition {
  id: string;
  name: string;
  description?: string;
  type: "number" | "boolean" | "color" | "select" | "range" | "text";
  defaultValue: unknown;
  /** For "select" type */
  options?: { value: string | number | boolean; label: string }[];
  /** For "number" / "range" type */
  min?: number;
  max?: number;
  step?: number;
  /** UI grouping: controls are organized into collapsible sections */
  group: "layout" | "colors" | "typography" | "axes" | "legend" | "interaction";
}

/** Resolved options = theme defaults + chart defaults + user overrides */
export type ResolvedOptions = Record<string, unknown>;

// ─── Chart Template ──────────────────────────────────────────────────

/**
 * The complete definition of a chart type.
 * Each chart module exports one of these.
 */
export interface ChartTemplate {
  // --- Metadata ---
  id: string;
  name: string;
  description: string;
  category: ChartCategory;
  tags: string[];
  thumbnail: string; // SVG string or data URL

  // --- Data Requirements ---
  dimensions: DimensionDefinition[];

  // --- Visual Options (chart-specific, beyond theme) ---
  visualOptions: VisualOptionDefinition[];

  // --- Smart Mapping Suggestions ---
  /** Helps auto-map when column names match common patterns */
  mappingSuggestions?: {
    dimensionId: string;
    columnNamePatterns: RegExp[];
  }[];

  /**
   * Transform parsed data using the user's mapping config.
   * Produces a dataset shaped specifically for this chart type.
   */
  mapData: (
    data: DataRow[],
    mapping: MappingConfig,
    options: ResolvedOptions
  ) => MappedData;

  /**
   * Render the chart as SVG using D3.
   *
   * @param node - The SVG element to render into (already sized)
   * @param data - Result of mapData()
   * @param options - Merged visual options
   * @param theme - Active theme (read ALL visual properties from here)
   * @param dimensions - Available width and height in pixels
   */
  render: (
    node: SVGSVGElement,
    data: MappedData,
    options: ResolvedOptions,
    theme: Theme,
    dimensions: { width: number; height: number }
  ) => void;

  /**
   * Generate standalone code for the chart.
   * This is a SEPARATE code path from render() — it produces clean,
   * readable, well-commented source code as a string.
   *
   * @param format - "d3-standalone" produces a single HTML file;
   *                 "react-component" produces a .tsx file
   * @param responsive - Whether to include responsive resize handling
   */
  generateCode: (
    data: MappedData,
    options: ResolvedOptions,
    theme: Theme,
    format: "d3-standalone" | "react-component",
    responsive: boolean
  ) => string;
}

// ─── Chart Registry ──────────────────────────────────────────────────

/**
 * Central registry of all available chart types.
 * Used by the ChartSelect step to display available charts,
 * and by the engine to look up the active chart's template.
 */
export interface ChartRegistry {
  register(chart: ChartTemplate): void;
  get(id: string): ChartTemplate | undefined;
  getAll(): ChartTemplate[];
  /** Return only charts whose dimensions are compatible with the loaded data */
  getCompatible(columns: ColumnMeta[]): ChartTemplate[];
}
