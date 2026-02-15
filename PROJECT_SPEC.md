# OW Chart Builder — Project Specification

## Purpose

Build a web application that allows Oliver Wyman creatives and consultants to create data visualizations from tabular data, apply brand-consistent templates, and export them in multiple formats:

- **SVG** — for further editing in Adobe Illustrator or embedding in PowerPoint
- **Interactive code** (D3.js snippet or standalone React component) — for embedding in websites
- **Static image** (PNG) — for quick use in documents and emails

The tool follows a guided workflow similar to RAWGraphs (data → chart type → configure → export) but adds brand templating, interactive code export, and PowerPoint-ready output.

---

## Competitive Analysis: RAWGraphs vs Datawrapper vs Our Tool

### RAWGraphs — What We Take

- **Workflow pattern**: Data → Chart → Map → Customize → Export (proven, intuitive)
- **Dimension mapping concept**: Drag data columns to visual "slots" (x, y, color, size)
- **Separation of `mapData` and `render`**: Change visual options without re-processing data
- **SVG-first output**: Clean vector graphics editable in Illustrator
- **Client-side only**: No data leaves the browser — critical for confidential consulting data
- **Custom chart plugin system**: Templates as self-contained modules with defined interfaces

**RAWGraphs limitations we solve:**
- Static-only output (no interactive code export)
- No brand theming system
- No responsive awareness
- Stale development (core library on beta for 3+ years)

### Datawrapper — What We Take

Datawrapper's responsive and theming approach is best-in-class. Key patterns to adopt:

**1. Responsive Chart Architecture**
Datawrapper separates "plot area" from "chrome" (title, subtitle, legend, footer, source). On mobile, chrome elements reflow but the plot area maintains its integrity. This means:
- **Plot height vs chart height**: Users define the plot area height. Title, legend, annotations wrap independently. On small screens, a long title doesn't "eat" the chart space.
- **Two height modes**: Fixed height (constant across widths) or aspect-ratio-based (proportional scaling). User chooses per chart.
- **Adaptive label behavior**: Line charts switch from direct labeling to legend-based labeling on mobile. Bar charts hide value labels when bars get too narrow.
- **Desktop/tablet/mobile preview**: Built-in responsive preview at 3 breakpoints (320px, 400px, 600px) — user can see exactly how the chart looks before exporting.

**2. Theme System**
Datawrapper's custom themes control every non-data element: fonts (per element: title, axis, label, footer), colors (categorical palettes with grouping + descriptions), backgrounds, borders, padding, logos, and even CMYK equivalents for print. Themes are set at workspace level and inherited by all new charts.

Key insight: **themes are not just color swaps** — they define the complete visual grammar including spacing ratios, grid line styles, axis rendering, and annotation positioning.

**3. Smart Defaults**
Datawrapper pre-configures charts beautifully before any customization. Every chart type has intelligent defaults for label placement, color assignment, axis formatting, and spacing. Users customize *from* a good starting point, not *towards* one.

**4. Embed Code Architecture**
Datawrapper's embed uses a `postMessage` pattern: the chart in an iframe communicates its required height to the parent page via JavaScript events. The parent adjusts the iframe height dynamically. This ensures responsive sizing without the parent knowing chart internals.

**Datawrapper limitations we solve:**
- Closed-source (their themes are configured by their support team, not self-service)
- No SVG/PDF export on free tier
- No standalone code export (always requires Datawrapper hosting or embedding)
- SaaS dependency (data goes to their servers for hosted charts)
- No template creation by end users

### Our Tool — The Differentiator

| Capability | RAWGraphs | Datawrapper | OW Chart Builder |
|---|---|---|---|
| Client-side only (no data upload) | ✅ | ❌ (hosted) | ✅ |
| SVG export for Illustrator | ✅ | ✅ (paid) | ✅ |
| Interactive code export | ❌ | ❌ | ✅ |
| Responsive preview | ❌ | ✅ | ✅ |
| Responsive code export | ❌ | ✅ (embed only) | ✅ |
| Switchable themes | ❌ | ✅ (admin-only) | ✅ (self-service) |
| Custom template creation | ✅ (dev-only) | ❌ | ✅ (guided UI) |
| Brand token system | ❌ | ✅ (manual) | ✅ (config-driven) |
| PowerPoint export | ❌ | ❌ | ✅ (Phase 3) |
| Open-source / self-hosted | ✅ | ❌ | ✅ |

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | **React 18+ with TypeScript** | Component-based, strong typing, team familiarity |
| Styling | **Tailwind CSS** | Rapid prototyping, design token integration |
| Visualization engine | **D3.js v7** | Full SVG control, enables both static and interactive output |
| State management | **Zustand** | Lightweight, simple API, good for step-based workflows |
| Build tool | **Vite** | Fast dev server, optimized builds |
| Code editor (for code export preview) | **Monaco Editor** or **CodeMirror 6** | Syntax highlighting for exported code |
| Testing | **Vitest + React Testing Library** | Fast, Vite-native |

### No Backend Required (Phase 1)

All data processing happens client-side. No data leaves the browser — important for client-confidential data. Future phases may add a backend for saved templates, team sharing, or AI-powered chart suggestions.

---

## Application Architecture

```
src/
├── app/
│   ├── App.tsx                    # Main app with step navigation
│   ├── store.ts                   # Zustand store (global state)
│   └── router.tsx                 # Optional: if using URL-based steps
│
├── steps/                         # One component per workflow step
│   ├── 01-DataInput/
│   │   ├── DataInput.tsx          # Main step component
│   │   ├── PasteArea.tsx          # Paste from clipboard
│   │   ├── FileUpload.tsx         # CSV/TSV/XLSX upload
│   │   ├── SampleDatasets.tsx     # Built-in example datasets
│   │   └── DataPreview.tsx        # Editable data table preview
│   │
│   ├── 02-ChartSelect/
│   │   ├── ChartSelect.tsx        # Chart type picker
│   │   ├── ChartCard.tsx          # Individual chart type card
│   │   └── ChartPreview.tsx       # Small preview thumbnail
│   │
│   ├── 03-Mapping/
│   │   ├── Mapping.tsx            # Map data columns → visual dimensions
│   │   ├── DimensionSlot.tsx      # Drop target for a dimension
│   │   ├── ColumnChip.tsx         # Draggable data column
│   │   └── MappingPreview.tsx     # Live preview while mapping
│   │
│   ├── 04-Customize/
│   │   ├── Customize.tsx          # Visual options panel
│   │   ├── ColorPicker.tsx        # Brand-aware color picker
│   │   ├── TypographyPanel.tsx    # Font, size, weight controls
│   │   ├── LayoutPanel.tsx        # Margins, padding, dimensions
│   │   └── LivePreview.tsx        # Full-size live chart preview
│   │
│   └── 05-Export/
│       ├── Export.tsx              # Export options and download
│       ├── SvgExport.tsx          # SVG download + preview
│       ├── PngExport.tsx          # PNG rasterization + download
│       ├── CodeExport.tsx         # Interactive D3/React code export
│       └── ExportPreview.tsx      # Final preview with format tabs
│
├── charts/                        # Chart type definitions (the template system)
│   ├── types.ts                   # TypeScript interfaces for chart definitions
│   ├── registry.ts               # Chart registry (registers all available charts)
│   ├── bar-chart/
│   │   ├── index.ts               # Chart definition (metadata + dimensions + render)
│   │   ├── render.ts              # D3 render function (SVG output)
│   │   ├── interactive.ts         # Interactive D3 code generator
│   │   └── thumbnail.svg          # Static thumbnail for chart picker
│   ├── line-chart/
│   │   └── ...
│   ├── scatter-plot/
│   │   └── ...
│   ├── treemap/
│   │   └── ...
│   ├── stacked-bar/
│   │   └── ...
│   ├── donut-chart/
│   │   └── ...
│   ├── alluvial/
│   │   └── ...
│   └── heatmap/
│       └── ...
│
├── brand/                         # Theme system
│   ├── types.ts                   # Theme, NamedPalette, NamedGradient interfaces
│   ├── ThemeContext.tsx            # React context for active theme
│   ├── themeUtils.ts              # Merge theme + overrides, resolve responsive values
│   └── themes/
│       ├── ow-default.ts          # Oliver Wyman default theme
│       ├── ow-presentation.ts     # Optimized for slides
│       ├── ow-print.ts            # CMYK-safe, print-optimized
│       └── neutral.ts             # Clean, unbranded fallback
│
├── engine/                        # Core data processing engine
│   ├── parser.ts                  # CSV/TSV/XLSX → normalized data array
│   ├── detector.ts                # Auto-detect column types (string, number, date, ...)
│   ├── transformer.ts             # Aggregation, filtering, pivoting
│   ├── mapper.ts                  # Apply mapping config → chart-ready dataset
│   └── validator.ts               # Validate data against chart dimension requirements
│
├── export/                        # Export pipeline
│   ├── svg.ts                     # Clean SVG extraction from DOM
│   ├── png.ts                     # SVG → Canvas → PNG (via canvg or native)
│   ├── code-generator.ts          # Generate standalone D3/React code
│   └── pptx.ts                    # Future: SVG → PPTX shape conversion
│
├── components/                    # Shared UI components
│   ├── StepNavigation.tsx         # Step indicator + prev/next
│   ├── DataTable.tsx              # Reusable data table
│   ├── DragDrop.tsx               # Drag-and-drop primitives
│   ├── Tooltip.tsx
│   └── Modal.tsx
│
└── utils/
    ├── colors.ts                  # Color manipulation utilities
    ├── formats.ts                 # Number/date formatting
    └── download.ts                # Trigger browser downloads
```

---

## Core Concepts

### 1. Chart Definition Interface

Every chart type implements this interface. This is the heart of the template system:

```typescript
// src/charts/types.ts

interface ChartDefinition {
  // Metadata
  id: string;                      // e.g. "bar-chart"
  name: string;                    // e.g. "Bar Chart"
  description: string;
  category: ChartCategory;         // "comparison" | "distribution" | "composition" | "relationship" | "temporal"
  thumbnail: string;               // Path to thumbnail image/SVG

  // Data requirements
  dimensions: DimensionDefinition[];

  // Visual configuration
  visualOptions: VisualOptionDefinition[];

  // Rendering
  render: (
    node: SVGSVGElement,
    data: MappedData,
    options: ResolvedOptions,
    theme: BrandTheme
  ) => void;

  // Code generation (for interactive export)
  generateCode: (
    data: MappedData,
    options: ResolvedOptions,
    theme: BrandTheme,
    format: "d3" | "react"
  ) => string;
}

interface DimensionDefinition {
  id: string;                      // e.g. "x", "y", "color", "size", "label"
  name: string;                    // Human-readable name
  description: string;
  required: boolean;
  dataTypes: DataType[];           // Which column types are accepted
  multiple: boolean;               // Can multiple columns be mapped?
  aggregation?: AggregationType;   // Default aggregation if multiple values per group
}

type DataType = "string" | "number" | "date" | "boolean";
type AggregationType = "sum" | "mean" | "median" | "count" | "min" | "max";
type ChartCategory = "comparison" | "distribution" | "composition" | "relationship" | "temporal";

interface VisualOptionDefinition {
  id: string;
  name: string;
  type: "number" | "boolean" | "color" | "select" | "font" | "range";
  default: any;
  options?: { value: any; label: string }[];  // For "select" type
  min?: number;                                // For "number" / "range" type
  max?: number;
  step?: number;
  group: string;                               // UI grouping: "layout" | "colors" | "typography" | "axes" | "legend"
}
```

### 2. Theme System (Datawrapper-inspired, self-service)

The theme system controls ALL non-data visual elements. Themes are switchable at any point during the workflow. Multiple themes can coexist (e.g., "OW Digital", "OW Print", "OW Presentation", "Client A").

```typescript
// src/brand/types.ts

interface Theme {
  id: string;
  name: string;
  description: string;
  
  // --- Typography ---
  typography: {
    fontFamily: string;             // Primary font stack
    fontFamilyMono?: string;        // For data labels if needed
    // Per-element sizing and styling
    title: { size: number; weight: number; color: string; lineHeight: number; transform?: "uppercase" | "none" };
    subtitle: { size: number; weight: number; color: string; lineHeight: number };
    axisLabel: { size: number; weight: number; color: string };
    axisTick: { size: number; weight: number; color: string };
    dataLabel: { size: number; weight: number; color: string };
    legend: { size: number; weight: number; color: string };
    tooltip: { size: number; weight: number; color: string; background: string; border: string };
    footer: { size: number; weight: number; color: string };  // Source, notes
  };

  // --- Colors ---
  colors: {
    background: string;
    text: string;
    textSecondary: string;
    // Axis and grid
    axisLine: string;
    axisTickLine: string;
    gridLine: string;
    // Data palettes — multiple named palettes per category
    palettes: {
      categorical: NamedPalette[];    // For discrete categories
      sequential: NamedGradient[];    // For continuous values (low → high)
      diverging: NamedGradient[];     // For values around a midpoint
    };
    // Highlight and interaction
    highlight: string;
    highlightSecondary: string;
    muted: string;                    // For de-emphasized elements on hover
  };

  // --- Layout & Spacing ---
  layout: {
    chartPadding: { top: number; right: number; bottom: number; left: number };
    plotMargin: { top: number; right: number; bottom: number; left: number };
    titleGap: number;                 // Space between title and subtitle
    subtitleGap: number;              // Space between subtitle and plot
    legendGap: number;                // Space between plot and legend
    footerGap: number;                // Space between plot and footer/source
    barGap: number;                   // Fraction (0–1) of bandwidth
    barGroupGap: number;              // Fraction for grouped bars
  };

  // --- Axes & Grid ---
  axes: {
    strokeWidth: number;
    tickSize: number;
    tickPadding: number;
    gridLineStyle: "solid" | "dashed" | "dotted" | "none";
    gridLineWidth: number;
    gridLineOpacity: number;
    // Show/hide defaults per axis
    showXAxis: boolean;
    showYAxis: boolean;
    showXGrid: boolean;
    showYGrid: boolean;
  };

  // --- Responsive Behavior (Datawrapper-inspired) ---
  responsive: {
    breakpoints: {
      mobile: number;                  // e.g., 400
      tablet: number;                  // e.g., 600
      desktop: number;                 // e.g., 900
    };
    // Per-breakpoint overrides
    mobile: Partial<{
      typography: Partial<Theme["typography"]>;
      layout: Partial<Theme["layout"]>;
      // Behavioral changes
      labelMode: "direct" | "legend"; // Switch from direct labels to legend on mobile
      hiddenElements: string[];        // e.g., ["subtitle", "gridLines", "dataLabels"]
      axisTickCount: number;           // Fewer ticks on mobile
    }>;
  };

  // --- Chrome Elements ---
  chrome: {
    showTitle: boolean;
    showSubtitle: boolean;
    showFooter: boolean;
    showSource: boolean;
    showLogo: boolean;
    logoUrl?: string;
    logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    logoSize: { width: number; height: number };
    border?: { width: number; color: string; position: "top" | "bottom" | "all" | "none" };
  };

  // --- Print / Export Overrides ---
  print?: Partial<Theme> & {
    // CMYK equivalents for brand colors
    cmykOverrides?: Record<string, { c: number; m: number; y: number; k: number }>;
    // Minimum font sizes for print legibility
    minFontSize?: number;
  };
}

interface NamedPalette {
  id: string;
  name: string;                       // e.g., "Primary", "Warm", "Cool"
  description?: string;               // e.g., "Use for up to 6 categories"
  colors: string[];
  maxCategories?: number;             // Soft limit: warn if data exceeds this
}

interface NamedGradient {
  id: string;
  name: string;
  stops: string[];                    // 2 for sequential, 3 for diverging
}
```

**Theme Switching Logic:**
- Themes are loaded from JSON files in `src/brand/themes/`
- A theme dropdown in the Customize step lets users switch instantly
- All visual options have theme-aware defaults: when switching themes, options reset to the new theme's defaults unless the user has explicitly overridden them
- Each theme can define which palettes are available, restricting users to brand-compliant choices

**Shipped Themes (Phase 1):**
1. **OW Default** — Standard Oliver Wyman brand (replace placeholder colors with actuals)
2. **OW Presentation** — Optimized for slides: larger fonts, bolder colors, more padding
3. **OW Print** — CMYK-safe colors, minimum 8pt font, no transparency
4. **Neutral** — Clean, minimal theme for non-branded use cases

### 3. Template System (RAWGraphs-inspired, user-extensible)

Templates and themes are **separate concerns**:
- **Theme** = how things look (colors, fonts, spacing) — applies to ALL chart types
- **Template** = what chart type and how it behaves (dimensions, rendering logic, defaults)

A template is a complete chart type definition that can be created, shared, and loaded:

```typescript
// src/charts/types.ts

interface ChartTemplate {
  // --- Metadata ---
  id: string;                         // Unique identifier, e.g., "ow-waterfall-v1"
  name: string;                       // e.g., "Waterfall Chart"
  description: string;
  author: string;
  version: string;
  category: ChartCategory;
  tags: string[];                     // e.g., ["financial", "comparison", "change"]
  thumbnail: string;                  // Base64 or URL to preview image

  // --- Data Requirements ---
  dimensions: DimensionDefinition[];

  // --- Visual Options (template-specific) ---
  // These are the chart-specific knobs beyond what the theme provides
  visualOptions: VisualOptionDefinition[];

  // --- Default Mapping Suggestions ---
  // Helps auto-map when column names match common patterns
  mappingSuggestions?: {
    dimensionId: string;
    columnNamePatterns: string[];      // e.g., ["date", "year", "month", "time"]
  }[];

  // --- Rendering ---
  render: (
    node: SVGSVGElement,
    data: MappedData,
    options: ResolvedOptions,
    theme: Theme,
    dimensions: { width: number; height: number }
  ) => void;

  // --- Responsive Rendering ---
  // Optional: if provided, overrides render() at specific breakpoints
  renderResponsive?: (
    node: SVGSVGElement,
    data: MappedData,
    options: ResolvedOptions,
    theme: Theme,
    dimensions: { width: number; height: number },
    breakpoint: "mobile" | "tablet" | "desktop"
  ) => void;

  // --- Code Generation ---
  generateCode: (
    data: MappedData,
    options: ResolvedOptions,
    theme: Theme,
    format: "d3-standalone" | "react-component",
    responsive: boolean                // Include responsive handling in generated code
  ) => string;

  // --- Data Mapping ---
  mapData: (
    data: ParsedRow[],
    mapping: MappingConfig,
    options: ResolvedOptions
  ) => MappedData;
}
```

**Template Registry & Loading:**
```typescript
// src/charts/registry.ts

class ChartRegistry {
  private charts: Map<string, ChartTemplate> = new Map();

  // Register built-in charts
  registerBuiltIn(chart: ChartTemplate): void;

  // Load custom chart from JSON + JS bundle (like RAWGraphs custom charts)
  loadCustom(url: string): Promise<ChartTemplate>;

  // Export chart definition for sharing
  exportTemplate(chartId: string): string; // JSON bundle

  // Get all registered charts, optionally filtered
  getCharts(filter?: { category?: ChartCategory; dataTypes?: DataType[] }): ChartTemplate[];

  // Smart filtering: which charts work with the loaded data
  getCompatibleCharts(columns: ColumnMeta[]): ChartTemplate[];
}
```

**Template Creation Flow (Phase 3):**
Users can create new templates through:
1. Duplicating an existing template as starting point
2. Modifying the dimension definitions (add/remove/rename slots)
3. Writing or modifying the D3 render function (code editor in-app)
4. Testing with sample data in a sandbox preview
5. Saving and sharing as `.owchart` file (JSON + bundled JS)

### 4. Responsive Chart Architecture

Inspired by Datawrapper, our charts are **responsive-aware by design**. This affects both the live preview AND the exported code.

**Core Principle: Plot vs Chrome Separation**

```
┌─────────────────────────────────────┐
│ CHROME: Title                       │  ← Reflows independently
│ CHROME: Subtitle                    │  ← Can be hidden on mobile
├─────────────────────────────────────┤
│                                     │
│         PLOT AREA                   │  ← Height defined by user
│    (the actual chart)               │     (fixed px or aspect ratio)
│                                     │
├─────────────────────────────────────┤
│ CHROME: Legend                      │  ← Repositions (bottom → below)
│ CHROME: Source / Notes              │  ← Wraps to multiple lines
└─────────────────────────────────────┘
```

**Responsive Behaviors (automatic, per chart type):**

| Behavior | Desktop | Mobile |
|---|---|---|
| Label placement | Direct labels on data | Legend-based |
| Axis ticks | Full density | Reduced (every Nth) |
| Data labels | All visible | Hidden or on-hover |
| Legend position | Right of plot | Below plot |
| Tooltip | On hover | On tap |
| Grid lines | Dashed, subtle | Hidden or minimal |
| Title | Full length | Wraps naturally |
| Bar labels | Inside or beside | Beside only |

**Responsive Preview Component:**

```typescript
// src/components/ResponsivePreview.tsx

interface ResponsivePreviewProps {
  chart: ChartTemplate;
  data: MappedData;
  options: ResolvedOptions;
  theme: Theme;
}

// Shows 3 panels side by side: mobile (320px) | tablet (600px) | desktop (900px)
// Or a single resizable panel with a drag handle (like Datawrapper)
// Breakpoint widths are configurable via theme.responsive.breakpoints
```

**Responsive Code Export:**

When `responsive: true` is set in code generation, the exported code includes:
- `ResizeObserver` or `window.resize` listener
- Breakpoint detection
- Automatic re-render with mobile-specific adjustments
- Proper `viewBox` handling for SVG scaling

### 5. Data Flow

```
Raw Input (paste/CSV/XLSX)
    │
    ▼
Parser (engine/parser.ts)
    │  → Normalized array of objects: { [columnName]: value }[]
    │  → Column metadata: { name, detectedType, uniqueValues, min, max, nullCount }
    ▼
Type Detection (engine/detector.ts)
    │  → Confirmed types per column (user can override)
    ▼
Mapping (engine/mapper.ts)
    │  → User drags columns to dimension slots
    │  → Template's mapData() transforms dataset
    │  → Produces MappedData: shaped for the chart
    ▼
Render (charts/[type]/render.ts)
    │  → D3 renders SVG into container node
    │  → Theme applied (colors, fonts, spacing, chrome)
    │  → Responsive breakpoint determines variant
    ▼
Export (export/*.ts)
    → SVG: serialize rendered SVG node (static, single breakpoint)
    → PNG: rasterize via Canvas API (at specified dimensions)
    → Code (D3): standalone HTML with responsive handling
    → Code (React): .tsx component with ResizeObserver
    → PPTX: SVG → PowerPoint shapes (Phase 3)
```

### 6. Zustand Store Shape

```typescript
// src/app/store.ts

interface AppState {
  // Current step
  currentStep: 1 | 2 | 3 | 4 | 5;

  // Step 1: Data
  rawData: string | null;
  parsedData: DataRow[] | null;
  columns: ColumnMeta[] | null;
  dataSource: "paste" | "file" | "sample" | null;

  // Step 2: Chart selection
  selectedChart: string | null;        // Chart template ID

  // Step 3: Mapping
  mapping: Record<string, string | string[]>;  // dimensionId → columnName(s)

  // Step 4: Customization
  visualOptions: Record<string, any>;  // optionId → value (user overrides)
  selectedThemeId: string;             // Active theme ID
  themeOverrides: Partial<Theme>;      // User modifications on top of selected theme
  previewBreakpoint: "mobile" | "tablet" | "desktop" | "responsive"; // Preview mode
  previewWidth: number;                // Custom preview width (when responsive mode)
  chartTitle: string;
  chartSubtitle: string;
  chartSource: string;
  chartNotes: string;

  // Step 5: Export
  exportFormat: "svg" | "png" | "d3-standalone" | "react-component";
  exportResponsive: boolean;           // Include responsive handling in code export
  exportWidth: number;                 // SVG/PNG export width
  exportHeight: number;                // SVG/PNG export height
  exportScale: 1 | 2 | 3;            // PNG resolution multiplier

  // Computed / derived
  mappedData: MappedData | null;
  activeTheme: Theme;                  // Merged: selectedTheme + themeOverrides

  // Actions
  setRawData: (data: string, source: DataSource) => void;
  selectChart: (chartId: string) => void;
  setMapping: (dimensionId: string, columns: string | string[]) => void;
  setVisualOption: (optionId: string, value: any) => void;
  setTheme: (themeId: string) => void;
  setThemeOverride: (path: string, value: any) => void; // e.g., "typography.title.size", 24
  resetThemeOverrides: () => void;
  setPreviewBreakpoint: (bp: "mobile" | "tablet" | "desktop" | "responsive") => void;
  setExportFormat: (format: ExportFormat) => void;
  reset: () => void;
  goToStep: (step: number) => void;
}
```

---

## Workflow Steps — Detailed Requirements

### Step 1: Data Input

**Must support:**
- Paste tabular data from clipboard (Excel, Google Sheets, any TSV/CSV source)
- Upload CSV, TSV, or XLSX files
- Built-in sample datasets (3–5 examples covering different chart types)
- Editable data table preview after parsing

**Parser requirements:**
- Auto-detect delimiter (comma, tab, semicolon, pipe)
- Handle quoted fields, escaped characters, BOM
- Parse numbers with locale awareness (1.000,50 vs 1,000.50)
- Parse common date formats
- Handle empty cells gracefully
- For XLSX: use SheetJS (xlsx) library, read first sheet by default, allow sheet selection

**Column type detection:**
- Analyze first N rows (configurable, default 100)
- Detect: string, number (integer/float), date, boolean
- Show detected types in preview, allow user override
- Show data quality indicators: null count, unique values, min/max for numbers

### Step 2: Chart Selection

**Display chart types as cards with:**
- Thumbnail preview
- Name and short description
- Data requirement indicators (e.g., "requires 1 category + 1 number")
- Smart filtering: gray out or deprioritize charts that don't match the loaded data's column types

**Phase 1 chart types (confirmed):**
1. Column Chart — vertical bars comparing values across categories
2. Bar Chart — horizontal bars, useful for long category labels
3. Line Chart — trends and developments over time
4. Pie Chart — proportions of a whole (best with few categories)
5. Donut Chart — pie variation with center space for additional info
6. Area Chart — volume and trend over time, emphasizing magnitude
7. Stacked Column Chart — composition within categories (vertical)
8. Stacked Bar Chart — composition within categories (horizontal)
9. Waterfall Chart — sequential positive/negative contributions to a total (e.g., EBIT bridge)
10. Heatmap — color intensity across a matrix
11. Treemap — hierarchical data as nested rectangles sized by value
12. Mekko Chart (Marimekko) — stacked columns with variable widths showing two dimensions plus proportional size

**All 12 chart types ship in Phase 1. Implementation priority order:**
Column → Bar → Line → Stacked Column → Stacked Bar → Pie → Donut → Area → Waterfall → Heatmap → Treemap → Mekko

### Step 3: Mapping

**Drag-and-drop interface:**
- Left panel: available data columns as draggable chips (colored by type)
- Right panel: dimension slots defined by the selected chart
- Visual feedback: highlight compatible slots when dragging a column
- Required dimensions marked with asterisk
- Show validation: green check when minimum mapping is satisfied

**Live preview:**
- Small preview updates in real-time as dimensions are mapped
- Helpful error messages if mapping is incomplete or incompatible

### Step 4: Customize

**Two-panel layout:** Controls on the left, live preview on the right.

**Theme Selector (top of controls):**
- Dropdown to switch between installed themes
- Instant full re-render on switch
- Visual indicator when user has overridden theme defaults (e.g., orange dot)
- "Reset to theme defaults" button

**Organized in collapsible groups:**

**Content (Chart Chrome):**
- Title text + alignment
- Subtitle text
- Source text (footer)
- Notes text (footer)
- Show/hide logo (if theme includes one)

**Layout:**
- Chart width and height (px)
- Plot height mode: "Fixed" or "Aspect ratio" (Datawrapper pattern)
- Padding / margins
- Aspect ratio lock toggle

**Colors:**
- Palette picker: shows all palettes from active theme (categorical, sequential, diverging as appropriate for chart type)
- Individual color overrides per series/category
- Background color
- Warning when exceeding palette's `maxCategories`

**Typography:**
- Font family (from theme-defined list, not arbitrary)
- Per-element size overrides (title, labels, axes)
- Font weight toggle (normal/bold)

**Axes & Grid:**
- Show/hide X axis, Y axis
- Custom axis labels
- Grid lines on/off + style (from theme options)
- Tick format (number format, date format)
- Axis scale (linear, log — where applicable)
- Tick count override

**Legend:**
- Show/hide
- Position (top, bottom, left, right)
- Orientation (horizontal, vertical)

**Responsive Preview (bottom of preview panel or toggle):**
- Toggle buttons: 📱 Mobile (320px) | 📱 Tablet (600px) | 🖥️ Desktop (900px) | ↔️ Drag
- In "Drag" mode: resizable preview with drag handle (like Datawrapper)
- Chart re-renders live at each breakpoint using theme's responsive overrides
- Visual diff: highlights what changes between breakpoints (labels hidden, legend moved, etc.)

**Live preview:** Full-size chart preview updates immediately on any change.

### Step 5: Export

**SVG Download:**
- Clean, well-structured SVG
- Rendered at user-specified dimensions (export width × height)
- Embedded fonts (as web font references) or converted to paths
- Proper viewBox for scaling
- Grouped elements with meaningful class names and IDs
- Optimized (remove D3 internal attributes, inline only necessary styles)
- Option: "Outlined text" (convert text to paths for Illustrator compatibility)
- Option: "Include chrome" (with/without title, subtitle, source, logo)

**PNG Download:**
- Configurable resolution: 1x, 2x, 3x (for retina)
- Transparent or white background option
- Uses Canvas API to rasterize SVG
- Dimension presets: "Presentation slide" (1920×1080), "Social media" (1200×630), "Custom"

**Code Export — D3 Standalone:**
- Single HTML file with:
  - Embedded D3 from CDN
  - All data inlined as `const data = [...]`
  - Complete render function with responsive handling
  - Theme styles inlined as CSS variables
  - Interaction handlers (tooltip, hover highlight, click)
  - `ResizeObserver` for responsive re-rendering
  - Breakpoint-aware layout adjustments
  - Well-commented, readable code
- Toggle: "Responsive" on/off (if off: fixed-size, simpler code)
- Toggle: "Include interactions" on/off

**Code Export — React Component:**
- Single `.tsx` file with:
  - Functional component with `useRef`, `useEffect`, `useState`
  - D3 rendering inside `useEffect`
  - `ResizeObserver` hook for responsive
  - Props interface for data, theme overrides, dimensions
  - All theme values as defaultProps
  - TypeScript types included
- Toggle: Same responsive and interaction toggles as D3

**Code Preview:**
- Syntax-highlighted code preview (Monaco Editor or CodeMirror)
- "Copy to clipboard" button
- "Download as file" button
- Live preview of the exported code in an iframe (so user sees exactly what they'll get)

---

## Theme Files — Structure and Defaults

Themes live as JSON files in `src/brand/themes/`. Each theme is a complete `Theme` object.

> **NOTE:** Replace the placeholder values below with actual OW brand values before development.

```typescript
// src/brand/themes/ow-default.ts

export const owDefaultTheme: Theme = {
  id: "ow-default",
  name: "Oliver Wyman Default",
  description: "Standard OW brand for digital and web use",

  typography: {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", // REPLACE with OW brand font
    title:     { size: 18, weight: 700, color: "#1A1A1A", lineHeight: 1.3 },
    subtitle:  { size: 14, weight: 400, color: "#555555", lineHeight: 1.4 },
    axisLabel: { size: 12, weight: 400, color: "#555555" },
    axisTick:  { size: 11, weight: 400, color: "#777777" },
    dataLabel: { size: 11, weight: 500, color: "#333333" },
    legend:    { size: 12, weight: 400, color: "#555555" },
    tooltip:   { size: 12, weight: 400, color: "#FFFFFF", background: "#333333", border: "none" },
    footer:    { size: 10, weight: 400, color: "#999999" },
  },

  colors: {
    background: "#FFFFFF",
    text: "#1A1A1A",
    textSecondary: "#555555",
    axisLine: "#333333",
    axisTickLine: "#CCCCCC",
    gridLine: "#E8E8E8",
    highlight: "#0082CA",        // REPLACE with OW accent
    highlightSecondary: "#00B5E2",
    muted: "#D0D0D0",
    palettes: {
      categorical: [
        {
          id: "primary",
          name: "OW Primary",
          description: "Main brand palette, up to 6 categories",
          colors: ["#00263E", "#0082CA", "#00B5E2", "#7AB800", "#F2A900", "#E03C31"], // REPLACE
          maxCategories: 6,
        },
        {
          id: "extended",
          name: "OW Extended",
          description: "For 7+ categories",
          colors: ["#003B5C", "#4298B5", "#8DC8E8", "#B5BD00", "#F0AB00", "#DA291C", "#6D2077", "#00A3AD"], // REPLACE
          maxCategories: 10,
        },
      ],
      sequential: [
        { id: "blue", name: "Blue Scale", stops: ["#E8F4FD", "#00263E"] },
        { id: "green", name: "Green Scale", stops: ["#F0F7E6", "#2D6E00"] },
      ],
      diverging: [
        { id: "red-blue", name: "Red–Blue", stops: ["#E03C31", "#F5F5F5", "#0082CA"] },
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
        axisLabel: { size: 10, weight: 400, color: "#555555" },
        axisTick: { size: 9, weight: 400, color: "#777777" },
        dataLabel: { size: 9, weight: 500, color: "#333333" },
      },
      layout: {
        plotMargin: { top: 12, right: 12, bottom: 30, left: 40 },
      },
      labelMode: "legend",
      axisTickCount: 5,
    },
  },

  chrome: {
    showTitle: true,
    showSubtitle: true,
    showFooter: true,
    showSource: true,
    showLogo: false,
    logoPosition: "bottom-right",
    logoSize: { width: 80, height: 24 },
  },
};
```

**Additional theme files to create:**
- `src/brand/themes/ow-presentation.ts` — Larger fonts (title: 24pt), more padding, bolder colors
- `src/brand/themes/ow-print.ts` — CMYK-safe colors, min 8pt, no transparency, solid grid lines
- `src/brand/themes/neutral.ts` — Clean grayscale, system fonts, minimal chrome

---

## Implementation Priorities

### Phase 1 — MVP (target: working local prototype)

**Setup & run locally: `npm install && npm run dev` → opens at localhost:5173**

1. **Project scaffolding**: Vite + React + TypeScript + Tailwind + Zustand + D3
2. **Theme system**: Load theme from JSON, theme context provider, theme switcher component
3. **Data Input step**: Paste and CSV upload with auto-parsing and type detection
4. **Chart templates**: Bar chart and line chart (2 charts to prove the architecture)
5. **Mapping step**: Drag-and-drop column → dimension mapping
6. **Customize step**: Theme switcher + basic options (colors, title, dimensions)
7. **Live preview**: Responsive preview with 3 breakpoints (mobile/tablet/desktop)
8. **SVG export**: Clean SVG download
9. **Themes shipped**: OW Default + Neutral (with placeholder brand values)

### Phase 2 — Extended Charts & Export

10. All Phase 1 chart types (10 total)
11. PNG export with resolution options and dimension presets
12. Code export: D3 standalone HTML with responsive handling
13. Full customization panel (all option groups)
14. Sample datasets (3–5 covering different chart types)
15. Per-element typography overrides
16. OW Presentation + OW Print themes

### Phase 3 — Advanced Features

17. React component code export
18. XLSX file upload (SheetJS integration)
19. Template creation UI (duplicate + modify existing chart types)
20. Template import/export (`.owchart` files)
21. PowerPoint export (SVG → PPTX)
22. Save/load project state (localStorage or `.owproject` file)
23. Phase 2 chart types (Alluvial, Waterfall, etc.)
24. Dark mode theme
25. Theme editor UI (visual theme customization in-app)

### Local Development Setup

```bash
# Clone and install
git clone <repo-url>
cd ow-chart-builder
npm install

# Start dev server (opens at http://localhost:5173)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Run tests
npm test
```

**For sharing the prototype internally without deployment:**
```bash
# Build and serve on local network
npm run build
npx serve dist/ --listen 3000

# Anyone on the same network can access via http://<your-ip>:3000
```

---

## Key Technical Decisions

### Why D3 directly instead of RAWGraphs core?

RAWGraphs uses D3 internally but wraps it in an abstraction (`rawgraphs-core`) that:
- Only outputs static SVG — no interactive code export path
- Has been on beta for 3+ years with infrequent updates
- Adds overhead without giving us what we need (code generation, brand theming, PPTX export)

Using D3 directly gives us full control over both the static SVG pipeline and the interactive code generation pipeline from the same chart definition.

### SVG Cleaning for Export

D3 adds internal attributes (`__data__`, event listeners, etc.) that clutter the SVG. The SVG export pipeline must:

1. Clone the rendered SVG node
2. Remove all `__data__` properties
3. Remove event listeners
4. Inline computed styles as attributes (not stylesheet references)
5. Add proper `xmlns` declarations
6. Set `viewBox` based on chart dimensions
7. Optionally convert text to paths (for Illustrator compatibility)

### Code Generation Strategy

Each chart's `generateCode()` function produces a self-contained code string. It does NOT try to serialize the D3 render function. Instead, it generates clean, idiomatic code that:

- Declares the data inline as a const
- Imports D3 from CDN (for HTML) or as npm import (for React)
- Rebuilds the visualization logic in readable, well-commented code
- Includes all brand styling inline
- Adds interaction handlers (tooltips, hover)

This means the code export is a **separate code path** from the render function — it produces equivalent output but as readable source code, not serialized function calls.

---

## Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "d3": "^7.9.0",
    "zustand": "^4.5.0",
    "xlsx": "^0.18.5",
    "papaparse": "^5.4.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "file-saver": "^2.0.5",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/d3": "^7.4.0",
    "eslint": "^9.0.0"
  }
}
```

---

## What's Still Missing / Open Questions

### 1. Brand Assets (REQUIRED before Phase 1)
- [ ] Exact OW color palettes (primary, secondary, extended, data viz palettes)
- [ ] Approved font families + web font files (WOFF2) or CDN links
- [ ] Any existing OW data visualization guidelines or style guides
- [ ] Logo file (SVG) if charts should optionally include it

### 2. Design Decisions (RECOMMENDED before Phase 1)
- [ ] UI design / wireframes for the 5-step workflow (or should Claude Code design these?)
- [ ] Mobile support for the tool itself? (Tool is desktop-focused, but exported charts are responsive)
- [ ] Accessibility requirements for the tool UI (WCAG level?)

### 3. Deployment (CONFIRMED)
- [x] **First test: local** (`npm run dev` on developer machine, share via `npx serve`)
- [x] **Production: Azure** (Azure Static Web Apps — Jens handles setup)
- [ ] Authentication needed? (Azure AD / Entra ID SSO?)
- [ ] Domain / URL preference (e.g., `charts.oliverwyman.com`)
- [ ] CI/CD: Azure DevOps pipeline or GitHub Actions?

### 4. Data & Privacy
- [x] Fully client-side processing confirmed (no server-side data handling)
- [ ] Any data classification restrictions for in-browser processing?
- [ ] Analytics / usage tracking requirements?

### 5. Content Decisions
- [ ] Which sample datasets to include? (Suggest: financial, demographic, time-series, categorical, hierarchical)
- [ ] Chart type priority order — confirm top 10 for Phase 1
- [ ] Should there be an onboarding / tutorial flow?

### 6. Theme-Specific Questions
- [ ] How many OW sub-brands or client themes needed?
- [ ] Should users be able to create themes, or only select from pre-built ones?
- [ ] Print export: do you need actual CMYK conversion, or is "print-optimized RGB" sufficient?

### 7. Future Integration
- [ ] Integration with existing OW tools or platforms?
- [ ] API for programmatic chart generation (e.g., from Python/R)?
- [ ] AI-powered features roadmap (auto-chart suggestions, natural language queries)?

---

## Instructions for Claude Code

When building this project:

1. **Start with scaffolding**: Set up Vite + React + TypeScript + Tailwind + Zustand + D3. Get `npm run dev` working with a basic multi-step navigation and placeholder content in each step. Verify: opening `http://localhost:5173` shows the app.

2. **Build the theme system early**: Implement `Theme` interface, `ThemeContext`, theme loading, and the theme switcher component. Ship with 2 themes (OW Default + Neutral). All rendering code should consume theme values from context — never hardcode colors, fonts, or spacing.

3. **Build the engine layer**: `parser.ts`, `detector.ts`, and `mapper.ts` — these are the foundation. Write tests for these. The parser must handle European number formats (1.000,50) as the team is global.

4. **Implement one chart end-to-end**: Pick Bar Chart. Build the full pipeline: data input → chart selection → mapping → responsive preview → SVG export. This proves the architecture before scaling to more chart types.

5. **Add responsive preview**: Implement the 3-breakpoint preview (mobile/tablet/desktop) and the resizable drag handle mode. The chart must re-render correctly at each size, using theme responsive overrides.

6. **Then expand**: Add chart types one by one. Each chart is a self-contained module following the `ChartTemplate` interface. Each chart must implement `render()`, `mapData()`, and `generateCode()`.

7. **Code quality expectations**:
   - TypeScript strict mode
   - All chart templates and themes fully typed
   - Unit tests for parser, detector, mapper, and export functions
   - Component tests for each step
   - Clean, commented D3 render functions (they serve as documentation for the code export)
   - No hardcoded colors, fonts, or spacing anywhere — everything via theme

8. **Design the UI to be clean and professional** — this is a tool for designers. The interface itself should demonstrate good design principles. Reference Datawrapper's clean aesthetic for the controls and RAWGraphs' workflow for the step progression, but make it more polished than both.

9. **Local-first**: Everything must work without any backend, server, or network connection. Data never leaves the browser. The only external dependency is the D3 CDN link in exported code (and even that should have a "bundle D3 inline" option).
