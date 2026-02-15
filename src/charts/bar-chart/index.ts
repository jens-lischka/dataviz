/**
 * Bar Chart Template
 *
 * Horizontal bar chart comparing values across categories.
 * Essentially a column chart rotated 90 degrees — ideal for
 * long category labels that would overlap on an x-axis.
 */

import * as d3 from "d3";
import type { ChartTemplate, DataRow, MappingConfig, MappedData, ResolvedOptions } from "../types";
import type { Theme } from "@/brand/types";
import { groupAndAggregate } from "@/engine/mapper";
import { parseNumber } from "@/engine/detector";

// ─── Thumbnail SVG ───────────────────────────────────────────────────

const THUMBNAIL_SVG = `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="55" height="12" rx="2" fill="#0082CA" opacity="0.9"/>
  <rect x="8" y="24" width="85" height="12" rx="2" fill="#0082CA" opacity="0.9"/>
  <rect x="8" y="40" width="65" height="12" rx="2" fill="#0082CA" opacity="0.9"/>
  <rect x="8" y="56" width="100" height="12" rx="2" fill="#0082CA" opacity="0.9"/>
  <line x1="7" y1="4" x2="7" y2="72" stroke="#999" stroke-width="1"/>
</svg>`;

// ─── Chart Definition ────────────────────────────────────────────────

export const barChart: ChartTemplate = {
  id: "bar-chart",
  name: "Bar Chart",
  description: "Horizontal bars — great for long category labels.",
  category: "comparison",
  tags: ["comparison", "categorical", "horizontal"],
  thumbnail: THUMBNAIL_SVG,

  // ─── Dimensions ──────────────────────────────────────────────────
  dimensions: [
    {
      id: "y",
      name: "Categories (Y Axis)",
      description: "The categories to compare — one bar per value",
      required: true,
      acceptedTypes: ["string", "number", "date"],
      multiple: false,
    },
    {
      id: "x",
      name: "Values (X Axis)",
      description: "The numeric values determining bar lengths",
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

  // ─── Visual Options ───────────────────────────────────────────────
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
      id: "xAxisStart",
      name: "X axis starts at zero",
      type: "boolean",
      defaultValue: true,
      group: "axes",
    },
  ],

  // ─── Smart Mapping Suggestions ───────────────────────────────────
  mappingSuggestions: [
    {
      dimensionId: "y",
      columnNamePatterns: [/category/i, /name/i, /label/i, /group/i, /type/i, /region/i, /country/i],
    },
    {
      dimensionId: "x",
      columnNamePatterns: [/value/i, /amount/i, /total/i, /count/i, /revenue/i, /sales/i, /score/i],
    },
    {
      dimensionId: "color",
      columnNamePatterns: [/series/i, /group/i, /segment/i, /color/i],
    },
  ],

  // ─── Data Mapping ────────────────────────────────────────────────
  mapData(data: DataRow[], mapping: MappingConfig, _options: ResolvedOptions): MappedData {
    const yCol = mapping.y as string;
    const xCol = mapping.x as string;
    const colorCol = mapping.color as string | undefined;

    if (!yCol || !xCol) return [];

    if (colorCol) {
      return data
        .map((row) => ({
          category: String(row[yCol] ?? ""),
          series: String(row[colorCol] ?? ""),
          value: typeof row[xCol] === "number" ? row[xCol] : parseNumber(String(row[xCol] ?? "")) ?? 0,
        }))
        .filter((d) => d.category !== "");
    }

    // Simple: aggregate by category
    return groupAndAggregate(data, yCol, xCol, "sum");
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
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Increase left margin for category labels
    const leftMargin = Math.max(margin.left, 80);
    const plotWidth = width - leftMargin - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    if (plotWidth <= 0 || plotHeight <= 0 || data.length === 0) return;

    // Apply sorting
    let sortedData = [...data] as { category: string; value: number }[];
    const sort = options.sortBars as string;
    if (sort === "asc") sortedData.sort((a, b) => a.value - b.value);
    if (sort === "desc") sortedData.sort((a, b) => b.value - a.value);

    // ─── Scales ────────────────────────────────────────────────
    const categories = sortedData.map((d) => d.category);
    const yScale = d3
      .scaleBand()
      .domain(categories)
      .range([0, plotHeight])
      .padding(theme.layout.barGap);

    const xMin = options.xAxisStart ? 0 : d3.min(sortedData, (d) => d.value) ?? 0;
    const xMax = d3.max(sortedData, (d) => d.value) ?? 0;
    const xScale = d3
      .scaleLinear()
      .domain([Math.min(xMin, 0), xMax * 1.05])
      .nice()
      .range([0, plotWidth]);

    // ─── Color ─────────────────────────────────────────────────
    const palette = theme.colors.palettes.categorical[0]?.colors ?? ["#3b82f6"];
    const colorScale = d3.scaleOrdinal<string>().domain(categories).range(palette);

    // ─── Plot Group ────────────────────────────────────────────
    const g = svg
      .append("g")
      .attr("transform", `translate(${leftMargin},${margin.top})`);

    // ─── Grid Lines (vertical) ─────────────────────────────────
    if (theme.axes.showXGrid || theme.axes.showYGrid) {
      g.append("g")
        .attr("class", "grid-x")
        .selectAll("line")
        .data(xScale.ticks(6))
        .join("line")
        .attr("x1", (d) => xScale(d))
        .attr("x2", (d) => xScale(d))
        .attr("y1", 0)
        .attr("y2", plotHeight)
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
      .attr("x", (d) => xScale(Math.min(0, d.value)))
      .attr("y", (d) => yScale(d.category) ?? 0)
      .attr("width", (d) => Math.abs(xScale(d.value) - xScale(0)))
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale(d.category))
      .attr("rx", radius)
      .attr("ry", radius);

    // ─── Value Labels ──────────────────────────────────────────
    if (options.showValues) {
      g.selectAll(".value-label")
        .data(sortedData)
        .join("text")
        .attr("class", "value-label")
        .attr("x", (d) => xScale(d.value) + 6)
        .attr("y", (d) => (yScale(d.category) ?? 0) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", theme.typography.dataLabel.size)
        .attr("font-weight", theme.typography.dataLabel.weight)
        .attr("fill", theme.typography.dataLabel.color)
        .text((d) => d3.format(",.0f")(d.value));
    }

    // ─── Y Axis (categories) ────────────────────────────────────
    if (theme.axes.showYAxis) {
      const yAxis = g
        .append("g")
        .attr("class", "axis-y")
        .call(d3.axisLeft(yScale).tickSize(0).tickPadding(theme.axes.tickPadding));

      yAxis.select(".domain").attr("stroke", theme.colors.axisLine).attr("stroke-width", theme.axes.strokeWidth);
      yAxis
        .selectAll(".tick text")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", theme.typography.axisTick.size)
        .attr("fill", theme.typography.axisTick.color);
    }

    // ─── X Axis (values) ────────────────────────────────────────
    if (theme.axes.showXAxis) {
      const xAxis = g
        .append("g")
        .attr("class", "axis-x")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(xScale).ticks(6).tickSize(theme.axes.tickSize).tickPadding(theme.axes.tickPadding));

      xAxis.select(".domain").attr("stroke", theme.colors.axisLine).attr("stroke-width", theme.axes.strokeWidth);
      xAxis.selectAll(".tick line").attr("stroke", theme.colors.axisTickLine);
      xAxis
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
    return "// Code generation not yet implemented for Bar Chart.\n// Coming in Phase 2.";
  },
};
