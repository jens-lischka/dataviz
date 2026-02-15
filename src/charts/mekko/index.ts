/**
 * Mekko (Marimekko) Chart Template
 *
 * A two-dimensional stacked chart where both column widths and
 * segment heights encode data values. Column widths represent one
 * measure (e.g. market size) and vertical segments represent
 * composition within each column.
 *
 * Data shape: each row specifies an x-category, a segment (series),
 * and a value. Column widths come from a separate "width" dimension,
 * or are derived as the sum of segment values per x-category.
 */

import * as d3 from "d3";
import type { ChartTemplate, DataRow, MappingConfig, MappedData, ResolvedOptions } from "../types";
import type { Theme } from "@/brand/types";
import { parseNumber } from "@/engine/detector";

// ─── Thumbnail SVG ───────────────────────────────────────────────────

const THUMBNAIL_SVG = `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="6"  y="10" width="30" height="30" fill="#00263E" opacity="0.9"/>
  <rect x="6"  y="40" width="30" height="20" fill="#0082CA" opacity="0.9"/>
  <rect x="6"  y="60" width="30" height="15" fill="#00B5E2" opacity="0.9"/>
  <rect x="38" y="5"  width="40" height="25" fill="#00263E" opacity="0.9"/>
  <rect x="38" y="30" width="40" height="30" fill="#0082CA" opacity="0.9"/>
  <rect x="38" y="60" width="40" height="15" fill="#00B5E2" opacity="0.9"/>
  <rect x="80" y="20" width="34" height="20" fill="#00263E" opacity="0.9"/>
  <rect x="80" y="40" width="34" height="15" fill="#0082CA" opacity="0.9"/>
  <rect x="80" y="55" width="34" height="20" fill="#00B5E2" opacity="0.9"/>
</svg>`;

// ─── Chart Definition ────────────────────────────────────────────────

export const mekkoChart: ChartTemplate = {
  id: "mekko",
  name: "Mekko (Marimekko)",
  description: "Column widths + stacked segments — shows both size and composition.",
  category: "composition",
  tags: ["composition", "proportion", "matrix"],
  thumbnail: THUMBNAIL_SVG,

  // ─── Dimensions ──────────────────────────────────────────────────
  dimensions: [
    {
      id: "x",
      name: "Categories (Columns)",
      description: "The main categories — each becomes a variable-width column",
      required: true,
      acceptedTypes: ["string"],
      multiple: false,
    },
    {
      id: "segment",
      name: "Segments (Series)",
      description: "The sub-categories stacked within each column",
      required: true,
      acceptedTypes: ["string"],
      multiple: false,
    },
    {
      id: "value",
      name: "Value",
      description: "Numeric value for each cell (category × segment). Column width = sum of its segment values.",
      required: true,
      acceptedTypes: ["number"],
      multiple: false,
    },
  ],

  // ─── Visual Options ───────────────────────────────────────────────
  visualOptions: [
    {
      id: "showValues",
      name: "Show value labels",
      type: "boolean",
      defaultValue: true,
      group: "layout",
    },
    {
      id: "showColumnLabels",
      name: "Show column totals",
      type: "boolean",
      defaultValue: true,
      group: "layout",
    },
    {
      id: "cellPadding",
      name: "Column gap",
      type: "range",
      defaultValue: 2,
      min: 0,
      max: 8,
      step: 1,
      group: "layout",
    },
  ],

  // ─── Smart Mapping Suggestions ───────────────────────────────────
  mappingSuggestions: [
    {
      dimensionId: "x",
      columnNamePatterns: [/region/i, /market/i, /country/i, /category/i],
    },
    {
      dimensionId: "segment",
      columnNamePatterns: [/segment/i, /product/i, /type/i, /series/i, /group/i],
    },
    {
      dimensionId: "value",
      columnNamePatterns: [/value/i, /amount/i, /revenue/i, /sales/i, /share/i, /size/i],
    },
  ],

  // ─── Data Mapping ────────────────────────────────────────────────
  mapData(data: DataRow[], mapping: MappingConfig, _options: ResolvedOptions): MappedData {
    const xCol = mapping.x as string;
    const segCol = mapping.segment as string;
    const valCol = mapping.value as string;

    if (!xCol || !segCol || !valCol) return [];

    return data
      .map((row) => ({
        x: String(row[xCol] ?? ""),
        segment: String(row[segCol] ?? ""),
        value: typeof row[valCol] === "number"
          ? row[valCol]
          : parseNumber(String(row[valCol] ?? "")) ?? 0,
      }))
      .filter((d) => d.x !== "" && d.segment !== "");
  },

  // ─── Render ──────────────────────────────────────────────────────
  render(
    node: SVGSVGElement,
    data: MappedData,
    options: ResolvedOptions,
    theme: Theme,
    dimensions: { width: number; height: number }
  ): void {
    const { width, height } = dimensions;
    const margin = theme.layout.plotMargin;

    const svg = d3.select(node);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    if (plotWidth <= 0 || plotHeight <= 0 || data.length === 0) return;

    const typedData = data as { x: string; segment: string; value: number }[];

    // ─── Compute column totals and segment proportions ─────────
    const xCategories = [...new Set(typedData.map((d) => d.x))];
    const segments = [...new Set(typedData.map((d) => d.segment))];

    // Total value per column (determines width)
    const columnTotals = new Map<string, number>();
    for (const cat of xCategories) {
      const total = d3.sum(typedData.filter((d) => d.x === cat), (d) => d.value);
      columnTotals.set(cat, total);
    }
    const grandTotal = d3.sum(columnTotals.values());
    if (grandTotal === 0) return;

    // ─── Column x-positions (variable widths) ──────────────────
    const gap = (options.cellPadding as number) ?? 2;
    const totalGaps = gap * (xCategories.length - 1);
    const availableWidth = plotWidth - totalGaps;

    interface ColumnLayout { x: number; width: number; total: number }
    const columnLayouts = new Map<string, ColumnLayout>();
    let currentX = 0;

    for (const cat of xCategories) {
      const colTotal = columnTotals.get(cat) ?? 0;
      const colWidth = (colTotal / grandTotal) * availableWidth;
      columnLayouts.set(cat, { x: currentX, width: colWidth, total: colTotal });
      currentX += colWidth + gap;
    }

    // ─── Color ─────────────────────────────────────────────────
    const palette = theme.colors.palettes.categorical[0]?.colors ?? ["#3b82f6"];
    const colorScale = d3.scaleOrdinal<string>().domain(segments).range(palette);

    // ─── Plot Group ────────────────────────────────────────────
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ─── Draw cells per column ─────────────────────────────────
    for (const cat of xCategories) {
      const layout = columnLayouts.get(cat)!;
      const colData = typedData.filter((d) => d.x === cat);

      // Stack segments within each column
      let currentY = 0;
      for (const seg of segments) {
        const cellData = colData.find((d) => d.segment === seg);
        const value = cellData?.value ?? 0;
        if (layout.total === 0) continue;

        const cellHeight = (value / layout.total) * plotHeight;

        // Cell rect
        g.append("rect")
          .attr("class", "mekko-cell")
          .attr("x", layout.x)
          .attr("y", currentY)
          .attr("width", layout.width)
          .attr("height", cellHeight)
          .attr("fill", colorScale(seg));

        // Value label (only if cell is big enough)
        if (options.showValues && cellHeight > 14 && layout.width > 30) {
          g.append("text")
            .attr("x", layout.x + layout.width / 2)
            .attr("y", currentY + cellHeight / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("font-family", theme.typography.fontFamily)
            .attr("font-size", Math.min(theme.typography.dataLabel.size, layout.width / 5))
            .attr("font-weight", theme.typography.dataLabel.weight)
            .attr("fill", "#FFFFFF")
            .text(d3.format(",.0f")(value));
        }

        currentY += cellHeight;
      }

      // Column label (category name) below chart
      g.append("text")
        .attr("x", layout.x + layout.width / 2)
        .attr("y", plotHeight + theme.axes.tickPadding + theme.axes.tickSize)
        .attr("text-anchor", "middle")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", theme.typography.axisTick.size)
        .attr("fill", theme.typography.axisTick.color)
        .text(cat);

      // Column total label above chart
      if (options.showColumnLabels) {
        g.append("text")
          .attr("x", layout.x + layout.width / 2)
          .attr("y", -6)
          .attr("text-anchor", "middle")
          .attr("font-family", theme.typography.fontFamily)
          .attr("font-size", theme.typography.dataLabel.size)
          .attr("font-weight", theme.typography.dataLabel.weight)
          .attr("fill", theme.typography.dataLabel.color)
          .text(d3.format(",.0f")(layout.total));
      }
    }

    // ─── Y Axis (percentage) ───────────────────────────────────
    if (theme.axes.showYAxis) {
      const yScale = d3.scaleLinear().domain([0, 100]).range([0, plotHeight]);

      const yAxis = g
        .append("g")
        .attr("class", "axis-y")
        .call(
          d3.axisLeft(yScale)
            .tickValues([0, 25, 50, 75, 100])
            .tickFormat((d) => `${d}%`)
            .tickSize(theme.axes.tickSize)
            .tickPadding(theme.axes.tickPadding)
        );

      yAxis.select(".domain").attr("stroke", theme.colors.axisLine).attr("stroke-width", theme.axes.strokeWidth);
      yAxis.selectAll(".tick line").attr("stroke", theme.colors.axisTickLine);
      yAxis
        .selectAll(".tick text")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", theme.typography.axisTick.size)
        .attr("fill", theme.typography.axisTick.color);
    }

    // ─── Legend ─────────────────────────────────────────────────
    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(0, ${plotHeight + 28})`);

    let legendX = 0;
    for (const seg of segments) {
      const item = legend.append("g").attr("transform", `translate(${legendX}, 0)`);

      item.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("rx", 2)
        .attr("fill", colorScale(seg));

      item.append("text")
        .attr("x", 14)
        .attr("y", 5)
        .attr("dy", "0.35em")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", theme.typography.legend.size)
        .attr("fill", theme.typography.legend.color)
        .text(seg);

      // Approximate text width for next item positioning
      legendX += 14 + seg.length * 7 + 16;
    }
  },

  // ─── Code Generation (Phase 2) ──────────────────────────────────
  generateCode(
    _data: MappedData,
    _options: ResolvedOptions,
    _theme: Theme,
    _format: "d3-standalone" | "react-component",
    _responsive: boolean
  ): string {
    return "// Code generation not yet implemented for Mekko Chart.\n// Coming in Phase 2.";
  },
};
