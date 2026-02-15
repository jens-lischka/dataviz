/**
 * Chart Registry
 *
 * Central registration point for all available chart templates.
 * The ChartSelect step reads from this registry to display available charts.
 *
 * To add a new chart type:
 * 1. Create a folder in src/charts/<chart-id>/
 * 2. Implement the ChartTemplate interface
 * 3. Import and register it in this file
 */

import type { ChartTemplate, ChartRegistry as IChartRegistry, ColumnMeta } from "./types";

// ─── Import Chart Templates ─────────────────────────────────────────
// TODO: Uncomment as charts are implemented
import { columnChart } from "./column-chart";
// import { barChart } from "./bar-chart";
// import { lineChart } from "./line-chart";
// import { pieChart } from "./pie-chart";
// import { donutChart } from "./donut-chart";
// import { areaChart } from "./area-chart";
// import { stackedColumnChart } from "./stacked-column";
// import { stackedBarChart } from "./stacked-bar";
// import { waterfallChart } from "./waterfall";
// import { heatmapChart } from "./heatmap";
// import { treemapChart } from "./treemap";
// import { mekkoChart } from "./mekko";

// ─── Registry Implementation ────────────────────────────────────────

class ChartRegistryImpl implements IChartRegistry {
  private charts = new Map<string, ChartTemplate>();

  register(chart: ChartTemplate): void {
    this.charts.set(chart.id, chart);
  }

  get(id: string): ChartTemplate | undefined {
    return this.charts.get(id);
  }

  getAll(): ChartTemplate[] {
    return Array.from(this.charts.values());
  }

  /**
   * Return charts compatible with the loaded data's column types.
   * A chart is compatible if every required dimension can be satisfied
   * by at least one column of an accepted type.
   */
  getCompatible(columns: ColumnMeta[]): ChartTemplate[] {
    const columnTypes = new Set(columns.map((c) => c.confirmedType));

    return this.getAll().filter((chart) => {
      return chart.dimensions
        .filter((d) => d.required)
        .every((dim) => dim.acceptedTypes.some((type) => columnTypes.has(type)));
    });
  }
}

// ─── Singleton Registry ──────────────────────────────────────────────

export const chartRegistry = new ChartRegistryImpl();

// Register all available charts
chartRegistry.register(columnChart);
// TODO: Register additional charts as they're implemented
// chartRegistry.register(barChart);
// chartRegistry.register(lineChart);
// etc.
