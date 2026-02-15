# OW Chart Builder — Claude Code Instructions

## What This Project Is

A client-side web application for creating brand-consistent data visualizations. Users paste/upload data, pick a chart type, map data columns to visual dimensions, customize the look via switchable themes, preview responsively, and export as SVG, PNG, or standalone interactive code (D3/React).

Think of it as **RAWGraphs' workflow + Datawrapper's responsiveness + self-service theme switching + interactive code export**.

## Quick Start

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

## Architecture Overview

```
src/
├── app/          → App shell, Zustand store, step navigation
├── steps/        → One folder per workflow step (01–05)
├── charts/       → Chart template modules (one folder per chart type)
├── brand/        → Theme system (types, context, theme JSON files)
├── engine/       → Data parsing, type detection, mapping, validation
├── export/       → SVG cleaning, PNG rasterization, code generation
├── components/   → Shared UI (DataTable, DragDrop, ResponsivePreview, etc.)
└── utils/        → Color manipulation, number formatting, download helpers
```

## Key Architectural Principles

### 1. Theme System (CRITICAL — build this first after scaffolding)

ALL visual properties come from the active theme. **Never hardcode** colors, fonts, font sizes, spacing, or grid styles. Every render function receives a `Theme` object and reads values from it.

- Themes are defined in `src/brand/themes/` as TypeScript files exporting `Theme` objects
- `ThemeContext` provides the active (merged) theme to all components
- Theme switcher in Step 4 (Customize) lets users switch instantly
- When switching themes, user overrides reset to new theme defaults unless explicitly pinned

### 2. Chart Templates — The Pattern

Every chart type follows the `ChartTemplate` interface in `src/charts/types.ts`. Each chart is a self-contained module:

```
charts/bar-chart/
├── index.ts          → Exports the ChartTemplate object
├── render.ts         → D3 render function: (svgNode, data, options, theme, dimensions) → void
├── mapData.ts        → Transform parsed data into chart-ready shape
├── codeGen.ts        → Generate standalone D3/React code as string
└── thumbnail.svg     → Static preview for chart picker
```

The `render()` function and `generateCode()` function produce EQUIVALENT output but are SEPARATE code paths. `render()` uses D3 imperatively on a DOM node. `generateCode()` produces clean, readable, well-commented source code as a string.

### 3. Responsive: Plot vs Chrome

Charts have two conceptual layers:
- **Chrome**: Title, subtitle, legend, source/footer, logo — reflows independently
- **Plot area**: The actual data visualization — user controls its height (fixed px or aspect ratio)

On mobile, chrome wraps naturally while the plot area maintains its integrity. Each theme defines `responsive.mobile` overrides (smaller fonts, fewer ticks, legend-below instead of legend-right, etc.).

### 4. Client-Side Only

Zero backend. All data stays in the browser. No network requests except loading D3 from CDN in exported code. This is non-negotiable — users work with confidential consulting data.

## Build Order (follow this sequence)

### Step 1: Scaffolding
- Vite + React 18 + TypeScript strict + Tailwind + Zustand + D3
- Basic `App.tsx` with 5-step navigation (clickable step indicator, prev/next)
- Each step renders a placeholder component
- Verify: `npm run dev` works, navigation between steps works

### Step 2: Theme System
- Implement `Theme` interface (`src/brand/types.ts` — already provided)
- Create `ThemeContext.tsx` with `useTheme()` hook
- Create `themeUtils.ts`: `mergeTheme()`, `resolveResponsiveTheme(theme, width)`
- Ship 2 themes: `ow-default.ts` and `neutral.ts` (already provided)
- Build `ThemeSwitcher` component (dropdown, shows theme name + color preview dots)
- Verify: switching themes updates context, all consumers re-render

### Step 3: Engine Layer
- `parser.ts`: Parse CSV/TSV from string, auto-detect delimiter, handle quoted fields
  - MUST handle European numbers (1.000,50) — the team is global
  - Use PapaParse for the heavy lifting
- `detector.ts`: Analyze columns, detect types (string/number/date/boolean)
- `mapper.ts`: Apply mapping config to produce chart-ready data
- `validator.ts`: Check if mapping satisfies a chart's dimension requirements
- Write tests for all of these (Vitest)

### Step 4: First Chart End-to-End (Column Chart)
- Implement `ChartTemplate` for Column Chart
- Build all 5 steps with real functionality:
  - Step 1: Paste data or upload CSV, see editable preview table
  - Step 2: Pick Column Chart (only one available initially)
  - Step 3: Drag columns to dimension slots (x-axis category, y-axis value, optional color)
  - Step 4: Theme switcher + basic visual options + responsive preview (3 breakpoints)
  - Step 5: SVG download
- This proves the entire architecture

### Step 5: Expand Chart Types
- Add charts one by one following the same pattern
- Each chart: `index.ts`, `render.ts`, `mapData.ts`, `codeGen.ts`, `thumbnail.svg`
- Priority order: Column → Bar → Line → Stacked Column → Stacked Bar → Pie → Donut → Area → Waterfall → Heatmap → Treemap → Mekko

### Step 6: Export Layer
- SVG export: Clone DOM node, clean D3 internals, inline styles, set viewBox
- PNG export: SVG → Canvas → Blob → download (1x/2x/3x scale)
- Code export: Generate standalone HTML with D3 CDN, or React .tsx component

## Chart Types — Complete List

| Chart | ID | Category | Key Dimensions |
|---|---|---|---|
| Column Chart | `column-chart` | comparison | x: category, y: value, [color: series] |
| Bar Chart | `bar-chart` | comparison | y: category, x: value, [color: series] |
| Line Chart | `line-chart` | temporal | x: time/category, y: value, [color: series] |
| Pie Chart | `pie-chart` | composition | category, value |
| Donut Chart | `donut-chart` | composition | category, value |
| Area Chart | `area-chart` | temporal | x: time/category, y: value, [color: series] |
| Stacked Column | `stacked-column` | composition | x: category, y: value, color: series |
| Stacked Bar | `stacked-bar` | composition | y: category, x: value, color: series |
| Waterfall | `waterfall` | comparison | category, value, [type: increase/decrease/total] |
| Heatmap | `heatmap` | relationship | x: category, y: category, value: intensity |
| Treemap | `treemap` | hierarchy | category, value, [parent/hierarchy] |
| Mekko (Marimekko) | `mekko` | composition | x: category (width=value), y: segments, value |

## UI Design Direction

This tool is built for designers — the UI itself must demonstrate excellent design. Follow these principles:

- **Clean, editorial aesthetic**: Generous whitespace, clear hierarchy, restrained use of color
- **Professional, not playful**: This is a consulting tool, not a consumer app
- **Typography-led**: Use a clean sans-serif (system font stack is fine for the tool UI itself — brand fonts are for the charts)
- **Subtle interactions**: Smooth transitions between steps, gentle hover states, no jarring animations
- **Two-panel layout in Steps 3–5**: Controls on left (max 360px), live preview on right
- **Step indicator**: Horizontal bar at top showing progress, clickable steps, current step highlighted
- **Dark sidebar option**: Consider a light-on-dark sidebar for the controls panel to separate it from the white chart preview area

Reference: Datawrapper's clean control panels + Figma's property inspector layout.

## Code Quality Rules

- TypeScript strict mode (`strict: true` in tsconfig)
- All chart templates and themes fully typed — no `any` except in clearly marked escape hatches
- D3 render functions must be well-commented (they serve as documentation AND as reference for code generation)
- Unit tests for: parser, detector, mapper, validator, SVG export cleaning, theme merging
- Component tests for: DataInput, ChartSelect, Mapping (drag-drop), ThemeSwitcher
- Use `const` assertions for theme objects where possible
- Prefer named exports over default exports (except for React components that need it)

## Files Already Provided

The following files in this repo contain the starting point — read them carefully:

- `src/charts/types.ts` — ChartTemplate, DimensionDefinition, VisualOptionDefinition interfaces
- `src/brand/types.ts` — Theme, NamedPalette, NamedGradient interfaces
- `src/brand/themes/ow-default.ts` — Complete OW Default theme with responsive overrides
- `src/brand/themes/neutral.ts` — Clean unbranded theme
- `src/app/store.ts` — Zustand store shape with all state and actions
- `src/engine/parser.ts` — Parser stub with PapaParse integration
- `src/charts/column-chart/index.ts` — Example chart template definition
- `PROJECT_SPEC.md` — Full project specification with detailed requirements

## Common Pitfalls to Avoid

1. **Don't hardcode visual values** — always read from theme
2. **Don't forget responsive** — every chart render must work at 320px AND 900px
3. **Don't couple render() to DOM** — it receives an SVG node, renders into it, done. No React state inside render functions.
4. **Don't make generateCode() serialize render()** — it's a separate code path that produces clean, readable source code
5. **PapaParse config** — set `dynamicTyping: false` and handle type conversion yourself in detector.ts, otherwise European numbers break
6. **D3 selections** — always use `d3.select(node)` not `d3.select("svg")` to avoid selecting wrong elements
7. **SVG export** — must remove `__data__` properties and D3 event listeners before serializing
8. **Theme switching** — when user switches theme, visual options should reset to new theme defaults (unless user has explicitly overridden a specific value)
