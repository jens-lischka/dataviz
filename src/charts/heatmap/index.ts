/**
 * Heatmap Template
 *
 * Displays a matrix of colored cells where color intensity
 * represents a numeric value. Great for spotting patterns
 * across two categorical dimensions.
 */

import * as d3 from "d3";
import type { ChartTemplate, DataRow, MappingConfig, MappedData, ResolvedOptions } from "../types";
import type { Theme } from "@/brand/types";
import { parseNumber } from "@/engine/detector";

// ─── Thumbnail SVG ───────────────────────────────────────────────────

const THUMBNAIL_SVG = `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="8" width="22" height="16" rx="2" fill="#0082CA" opacity="0.3"/>
  <rect x="36" y="8" width="22" height="16" rx="2" fill="#0082CA" opacity="0.7"/>
  <rect x="62" y="8" width="22" height="16" rx="2" fill="#0082CA" opacity="0.5"/>
  <rect x="88" y="8" width="22" height="16" rx="2" fill="#0082CA" opacity="0.9"/>
  <rect x="10" y="28" width="22" height="16" rx="2" fill="#0082CA" opacity="0.8"/>
  <rect x="36" y="28" width="22" height="16" rx="2" fill="#0082CA" opacity="0.4"/>
  <rect x="62" y="28" width="22" height="16" rx="2" fill="#0082CA" opacity="0.6"/>
  <rect x="88" y="28" width="22" height="16" rx="2" fill="#0082CA" opacity="0.2"/>
  <rect x="10" y="48" width="22" height="16" rx="2" fill="#0082CA" opacity="0.6"/>
  <rect x="36" y="48" width="22" height="16" rx="2" fill="#0082CA" opacity="0.9"/>
  <rect x="62" y="48" width="22" height="16" rx="2" fill="#0082CA" opacity="0.3"/>
  <rect x="88" y="48" width="22" height="16" rx="2" fill="#0082CA" opacity="0.7"/>
</svg>`;

// ─── Chart Definition ────────────────────────────────────────────────

export const heatmapChart: ChartTemplate = {
  id: "heatmap",
  name: "Heatmap",
  description: "Color-coded matrix — reveals patterns across two dimensions.",
  category: "relationship",
  tags: ["relationship", "matrix", "correlation"],
  thumbnail: THUMBNAIL_SVG,

  // ─── Dimensions ──────────────────────────────────────────────────
  dimensions: [
    {
      id: "x",
      name: "Columns (X Axis)",
      description: "Categories for the horizontal axis",
      required: true,
      acceptedTypes: ["string", "number", "date"],
      multiple: false,
    },
    {
      id: "y",
      name: "Rows (Y Axis)",
      description: "Categories for the vertical axis",
      required: true,
      acceptedTypes: ["string", "number", "date"],
      multiple: false,
    },
    {
      id: "value",
      name: "Value (Intensity)",
      description: "Numeric value determining cell color intensity",
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
      id: "cellRadius",
      name: "Cell corner radius",
      type: "range",
      defaultValue: 2,
      min: 0,
      max: 12,
      step: 1,
      group: "layout",
    },
    {
      id: "cellPadding",
      name: "Cell padding",
      type: "range",
      defaultValue: 2,
      min: 0,
      max: 8,
      step: 1,
      group: "layout",
    },
    {
      id: "colorScheme",
      name: "Color scale",
      type: "select",
      defaultValue: "sequential",
      options: [
        { value: "sequential", label: "Sequential" },
        { value: "diverging", label: "Diverging" },
      ],
      group: "colors",
    },
  ],

  // ─── Smart Mapping Suggestions ───────────────────────────────────
  mappingSuggestions: [
    {
      dimensionId: "x",
      columnNamePatterns: [/column/i, /segment/i, /category/i, /type/i],
    },
    {
      dimensionId: "y",
      columnNamePatterns: [/row/i, /product/i, /name/i, /label/i],
    },
    {
      dimensionId: "value",
      columnNamePatterns: [/value/i, /score/i, /rating/i, /count/i, /intensity/i],
    },
  ],

  // ─── Data Mapping ────────────────────────────────────────────────
  mapData(data: DataRow[], mapping: MappingConfig, _options: ResolvedOptions): MappedData {
    const xCol = mapping.x as string;
    const yCol = mapping.y as string;
    const valueCol = mapping.value as string;

    if (!xCol || !yCol || !valueCol) return [];

    return data
      .map((row) => ({
        x: String(row[xCol] ?? ""),
        y: String(row[yCol] ?? ""),
        value: typeof row[valueCol] === "number"
          ? row[valueCol]
          : parseNumber(String(row[valueCol] ?? "")) ?? 0,
      }))
      .filter((d) => d.x !== "" && d.y !== "");
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

    // Increase left margin for row labels
    const leftMargin = Math.max(margin.left, 80);
    const plotWidth = width - leftMargin - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    if (plotWidth <= 0 || plotHeight <= 0 || data.length === 0) return;

    const typedData = data as { x: string; y: string; value: number }[];

    // ─── Extract unique categories ─────────────────────────────
    const xCategories = [...new Set(typedData.map((d) => d.x))];
    const yCategories = [...new Set(typedData.map((d) => d.y))];

    // ─── Scales ────────────────────────────────────────────────
    const padding = (options.cellPadding as number) ?? 2;
    const xScale = d3
      .scaleBand()
      .domain(xCategories)
      .range([0, plotWidth])
      .padding(padding / 100); // Convert px to fraction

    const yScale = d3
      .scaleBand()
      .domain(yCategories)
      .range([0, plotHeight])
      .padding(padding / 100);

    // ─── Color Scale ───────────────────────────────────────────
    const allValues = typedData.map((d) => d.value);
    const minVal = d3.min(allValues) ?? 0;
    const maxVal = d3.max(allValues) ?? 1;

    const colorScheme = options.colorScheme as string;
    let colorScale: (v: number) => string;

    if (colorScheme === "diverging" && theme.colors.palettes.diverging.length > 0) {
      const stops = theme.colors.palettes.diverging[0].stops;
      const midVal = (minVal + maxVal) / 2;
      colorScale = d3.scaleLinear<string>()
        .domain([minVal, midVal, maxVal])
        .range(stops.length >= 3 ? stops : [stops[0], "#f5f5f5", stops[stops.length - 1]])
        .interpolate(d3.interpolateRgb) as unknown as (v: number) => string;
    } else {
      const stops = theme.colors.palettes.sequential[0]?.stops ?? ["#e8f4fd", "#00263E"];
      colorScale = d3.scaleLinear<string>()
        .domain([minVal, maxVal])
        .range(stops)
        .interpolate(d3.interpolateRgb) as unknown as (v: number) => string;
    }

    // ─── Plot Group ────────────────────────────────────────────
    const g = svg
      .append("g")
      .attr("transform", `translate(${leftMargin},${margin.top})`);

    // ─── Cells ─────────────────────────────────────────────────
    const radius = (options.cellRadius as number) ?? 2;

    g.selectAll(".cell")
      .data(typedData)
      .join("rect")
      .attr("class", "cell")
      .attr("x", (d) => xScale(d.x) ?? 0)
      .attr("y", (d) => yScale(d.y) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale(d.value))
      .attr("rx", radius)
      .attr("ry", radius);

    // ─── Value Labels ──────────────────────────────────────────
    if (options.showValues) {
      // Determine text color based on cell brightness for legibility
      g.selectAll(".value-label")
        .data(typedData)
        .join("text")
        .attr("class", "value-label")
        .attr("x", (d) => (xScale(d.x) ?? 0) + xScale.bandwidth() / 2)
        .attr("y", (d) => (yScale(d.y) ?? 0) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", Math.min(theme.typography.dataLabel.size, xScale.bandwidth() / 3))
        .attr("font-weight", theme.typography.dataLabel.weight)
        .attr("fill", (d) => {
          // Light text on dark backgrounds, dark text on light backgrounds
          const cellColor = d3.color(colorScale(d.value));
          if (!cellColor) return theme.typography.dataLabel.color;
          const rgb = cellColor.rgb();
          const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
          return luminance > 0.5 ? "#333333" : "#FFFFFF";
        })
        .text((d) => d3.format(".1f")(d.value));
    }

    // ─── X Axis (top or bottom) ─────────────────────────────────
    if (theme.axes.showXAxis) {
      const xAxis = g
        .append("g")
        .attr("class", "axis-x")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(xScale).tickSize(0).tickPadding(theme.axes.tickPadding));

      xAxis.select(".domain").remove();
      xAxis
        .selectAll(".tick text")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", theme.typography.axisTick.size)
        .attr("fill", theme.typography.axisTick.color);
    }

    // ─── Y Axis ─────────────────────────────────────────────────
    if (theme.axes.showYAxis) {
      const yAxis = g
        .append("g")
        .attr("class", "axis-y")
        .call(d3.axisLeft(yScale).tickSize(0).tickPadding(theme.axes.tickPadding));

      yAxis.select(".domain").remove();
      yAxis
        .selectAll(".tick text")
        .attr("font-family", theme.typography.fontFamily)
        .attr("font-size", theme.typography.axisTick.size)
        .attr("fill", theme.typography.axisTick.color);
    }

    // ─── Color Legend ───────────────────────────────────────────
    const legendWidth = Math.min(plotWidth * 0.4, 150);
    const legendHeight = 8;
    const legendX = plotWidth - legendWidth;
    const legendY = -margin.top / 2 - legendHeight / 2;

    // Gradient definition
    const gradientId = "heatmap-legend-gradient";
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%").attr("x2", "100%");

    if (colorScheme === "diverging" && theme.colors.palettes.diverging.length > 0) {
      const stops = theme.colors.palettes.diverging[0].stops;
      stops.forEach((color, i) => {
        gradient.append("stop")
          .attr("offset", `${(i / (stops.length - 1)) * 100}%`)
          .attr("stop-color", color);
      });
    } else {
      const stops = theme.colors.palettes.sequential[0]?.stops ?? ["#e8f4fd", "#00263E"];
      stops.forEach((color, i) => {
        gradient.append("stop")
          .attr("offset", `${(i / (stops.length - 1)) * 100}%`)
          .attr("stop-color", color);
      });
    }

    const legendG = g.append("g")
      .attr("transform", `translate(${legendX},${legendY})`);

    legendG.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("rx", 2)
      .attr("fill", `url(#${gradientId})`);

    legendG.append("text")
      .attr("x", 0)
      .attr("y", legendHeight + 10)
      .attr("font-family", theme.typography.fontFamily)
      .attr("font-size", theme.typography.legend.size - 1)
      .attr("fill", theme.typography.legend.color)
      .text(d3.format(",.1f")(minVal));

    legendG.append("text")
      .attr("x", legendWidth)
      .attr("y", legendHeight + 10)
      .attr("text-anchor", "end")
      .attr("font-family", theme.typography.fontFamily)
      .attr("font-size", theme.typography.legend.size - 1)
      .attr("fill", theme.typography.legend.color)
      .text(d3.format(",.1f")(maxVal));
  },

  // ─── Code Generation (Phase 2) ──────────────────────────────────
  generateCode(
    _data: MappedData,
    _options: ResolvedOptions,
    _theme: Theme,
    _format: "d3-standalone" | "react-component",
    _responsive: boolean
  ): string {
    return "// Code generation not yet implemented for Heatmap.\n// Coming in Phase 2.";
  },
};
