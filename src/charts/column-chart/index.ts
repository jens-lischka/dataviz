/**
 * Column Chart Template
 *
 * Vertical bar chart comparing values across categories.
 * This is the REFERENCE IMPLEMENTATION — all other chart types
 * should follow the same structure and patterns.
 *
 * Files in a chart module:
 * - index.ts     → Exports the ChartTemplate object (this file)
 * - render.ts    → D3 render function (TODO: extract when file grows)
 * - mapData.ts   → Data transformation (TODO: extract when complex)
 * - codeGen.ts   → Code generation (TODO: implement in Phase 2)
 */

import * as d3 from "d3";
import type { ChartTemplate, DataRow, MappingConfig, MappedData, ResolvedOptions } from "../types";
import type { Theme } from "@/brand/types";
import { groupAndAggregate } from "@/engine/mapper";
import { parseNumber } from "@/engine/detector";

// ─── Thumbnail SVG ───────────────────────────────────────────────────

const THUMBNAIL_SVG = `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="50" width="16" height="25" rx="2" fill="#0082CA" opacity="0.9"/>
  <rect x="32" y="20" width="16" height="55" rx="2" fill="#0082CA" opacity="0.9"/>
  <rect x="54" y="35" width="16" height="40" rx="2" fill="#0082CA" opacity="0.9"/>
  <rect x="76" y="10" width="16" height="65" rx="2" fill="#0082CA" opacity="0.9"/>
  <rect x="98" y="42" width="16" height="33" rx="2" fill="#0082CA" opacity="0.9"/>
  <line x1="8" y1="76" x2="116" y2="76" stroke="#999" stroke-width="1"/>
</svg>`;

// ─── Chart Definition ────────────────────────────────────────────────

export const columnChart: ChartTemplate = {
  id: "column-chart",
  name: "Column Chart",
  description: "Compares values across categories using vertical bars.",
  category: "comparison",
  tags: ["comparison", "categorical", "basic"],
  thumbnail: THUMBNAIL_SVG,

  // ─── Dimensions ──────────────────────────────────────────────────
  dimensions: [
    {
      id: "x",
      name: "Categories (X Axis)",
      description: "The categories to compare — one bar per value",
      required: true,
      acceptedTypes: ["string", "number", "date"],
      multiple: false,
    },
    {
      id: "y",
      name: "Values (Y Axis)",
      description: "The numeric values determining bar heights",
      required: true,
      acceptedTypes: ["number"],
      multiple: false,
    },
    {
      id: "color",
      name: "Color (Series)",
      description: "Optional: split bars into colored groups",
      required: false,
      acceptedTypes: ["string"],
      multiple: false,
    },
  ],

  // ─── Visual Options (chart-specific, beyond theme) ───────────────
  visualOptions: [
    {
      id: "sortBars",
      name: "Sort bars",
      type: "select",
      defaultValue: "none",
      options: [
        { value: "none", label: "Original order" },
        { value: "asc", label: "Ascending" },
        { value: "desc", label: "Descending" },
      ],
      group: "layout",
    },
    {
      id: "showValues",
      name: "Show value labels",
      type: "boolean",
      defaultValue: true,
      group: "layout",
    },
    {
      id: "valuePosition",
      name: "Label position",
      type: "select",
      defaultValue: "top",
      options: [
        { value: "top", label: "Above bar" },
        { value: "inside", label: "Inside bar" },
      ],
      group: "layout",
    },
    {
      id: "barCornerRadius",
      name: "Bar corner radius",
      type: "range",
      defaultValue: 2,
      min: 0,
      max: 12,
      step: 1,
      group: "layout",
    },
    {
      id: "yAxisStart",
      name: "Y axis starts at zero",
      type: "boolean",
      defaultValue: true,
      group: "axes",
    },
  ],

  // ─── Smart Mapping Suggestions ───────────────────────────────────
  mappingSuggestions: [
    {
      dimensionId: "x",
      columnNamePatterns: [/category/i, /name/i, /label/i, /group/i, /type/i, /region/i, /country/i],
    },
    {
      dimensionId: "y",
      columnNamePatterns: [/value/i, /amount/i, /total/i, /count/i, /revenue/i, /sales/i, /score/i],
    },
    {
      dimensionId: "color",
      columnNamePatterns: [/series/i, /group/i, /segment/i, /color/i],
    },
  ],

  // ─── Data Mapping ────────────────────────────────────────────────
  mapData(data: DataRow[], mapping: MappingConfig, _options: ResolvedOptions): MappedData {
    const xCol = mapping.x as string;
    const yCol = mapping.y as string;
    const colorCol = mapping.color as string | undefined;

    if (!xCol || !yCol) return [];

    if (colorCol) {
      // Grouped: each row becomes a data point with category + series + value
      return data
        .map((row) => ({
          category: String(row[xCol] ?? ""),
          series: String(row[colorCol] ?? ""),
          value: typeof row[yCol] === "number" ? row[yCol] : parseNumber(String(row[yCol] ?? "")) ?? 0,
        }))
        .filter((d) => d.category !== "");
    }

    // Simple: aggregate by category
    return groupAndAggregate(data, xCol, yCol, "sum");
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

    // Clear previous render
    const svg = d3.select(node);
    svg.selectAll("*").remove();

    // Set viewBox for responsive scaling
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    if (plotWidth <= 0 || plotHeight <= 0 || data.length === 0) return;

    // Apply sorting
    let sortedData = [...data] as { category: string; value: number }[];
    const sort = options.sortBars as string;
    if (sort === "asc") sortedData.sort((a, b) => a.value - b.value);
    if (sort === "desc") sortedData.sort((a, b) => b.value - a.value);

    // ─── Scales ────────────────────────────────────────────────
    const categories = sortedData.map((d) => d.category);
    const xScale = d3
      .scaleBand()
      .domain(categories)
      .range([0, plotWidth])
      .padding(theme.layout.barGap);

    const yMin = options.yAxisStart ? 0 : d3.min(sortedData, (d) => d.value) ?? 0;
    const yMax = d3.max(sortedData, (d) => d.value) ?? 0;
    const yScale = d3
      .scaleLinear()
      .domain([Math.min(yMin, 0), yMax * 1.05]) // 5% headroom
      .nice()
      .range([plotHeight, 0]);

    // ─── Color ─────────────────────────────────────────────────
    const palette = theme.colors.palettes.categorical[0]?.colors ?? ["#3b82f6"];
    const colorScale = d3.scaleOrdinal<string>().domain(categories).range(palette);

    // ─── Plot Group ────────────────────────────────────────────
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ─── Grid Lines ────────────────────────────────────────────
    if (theme.axes.showYGrid) {
      g.append("g")
        .attr("class", "grid-y")
        .selectAll("line")
        .data(yScale.ticks(6))
        .join("line")
        .attr("x1", 0)
        .attr("x2", plotWidth)
        .attr("y1", (d) => yScale(d))
        .attr("y2", (d) => yScale(d))
        .attr("stroke", theme.colors.gridLine)
        .attr("stroke-width", theme.axes.gridLineWidth)
        .attr("stroke-opacity", theme.axes.gridLineOpacity)
        .attr(
          "stroke-dasharray",
          theme.axes.gridLineStyle === "dashed"
            ? "4 3"
            : theme.axes.gridLineStyle === "dotted"
            ? "2 2"
            : "none"
        );
    }

    // ─── Bars ──────────────────────────────────────────────────
    const radius = (options.barCornerRadius as number) ?? 2;

    g.selectAll(".bar")
      .data(sortedData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.category) ?? 0)
      .attr("y", (d) => yScale(Math.max(0, d.value)))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => Math.abs(yScale(0) - yScale(d.value)))
      .attr("fill", (d) => colorScale(d.category))
      .attr("rx", radius)
      .attr("ry", radius);

    // ─── Value Labels ──────────────────────────────────────────
    if (options.showValues) {
      const pos = options.valuePosition as string;
      g.selectAll(".value-label")
        .data(sortedData)
        .join("text")
        .attr("class", "value-label")
        .attr("x", (d) => (xScale(d.category) ?? 0) + xScale.bandwidth() / 2)
        .attr("y", (d) =>
          pos === "inside"
            ? yScale(d.value) + 16
            : yScale(d.value) - 6
        )
        .attr("text-anchor", "middle")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", theme.typography.dataLabel.size)
        .attr("font-weight", theme.typography.dataLabel.weight)
        .attr("fill", pos === "inside" ? "#FFFFFF" : theme.typography.dataLabel.color)
        .text((d) => d3.format(",.0f")(d.value));
    }

    // ─── X Axis ────────────────────────────────────────────────
    if (theme.axes.showXAxis) {
      const xAxis = g
        .append("g")
        .attr("class", "axis-x")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(xScale).tickSize(theme.axes.tickSize).tickPadding(theme.axes.tickPadding));

      xAxis.select(".domain").attr("stroke", theme.colors.axisLine).attr("stroke-width", theme.axes.strokeWidth);
      xAxis.selectAll(".tick line").attr("stroke", theme.colors.axisTickLine);
      xAxis
        .selectAll(".tick text")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", theme.typography.axisTick.size)
        .attr("fill", theme.typography.axisTick.color);
    }

    // ─── Y Axis ────────────────────────────────────────────────
    if (theme.axes.showYAxis) {
      const yAxis = g
        .append("g")
        .attr("class", "axis-y")
        .call(d3.axisLeft(yScale).ticks(6).tickSize(theme.axes.tickSize).tickPadding(theme.axes.tickPadding));

      yAxis.select(".domain").attr("stroke", theme.colors.axisLine).attr("stroke-width", theme.axes.strokeWidth);
      yAxis.selectAll(".tick line").attr("stroke", theme.colors.axisTickLine);
      yAxis
        .selectAll(".tick text")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", theme.typography.axisTick.size)
        .attr("fill", theme.typography.axisTick.color);
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
    // TODO: Implement in Phase 2
    return "// Code generation not yet implemented for Column Chart.\n// Coming in Phase 2.";
  },
};
