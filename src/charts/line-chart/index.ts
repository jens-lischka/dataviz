/**
 * Line Chart Template
 *
 * Connects data points with lines to show trends over time
 * or across ordered categories. Supports multiple series
 * via the optional color dimension.
 */

import * as d3 from "d3";
import type { ChartTemplate, DataRow, MappingConfig, MappedData, ResolvedOptions } from "../types";
import type { Theme } from "@/brand/types";
import { parseNumber } from "@/engine/detector";

// ─── Thumbnail SVG ───────────────────────────────────────────────────

const THUMBNAIL_SVG = `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
  <polyline points="10,60 30,40 50,50 70,25 90,35 110,15" fill="none" stroke="#0082CA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="10,55 30,55 50,40 70,45 90,30 110,35" fill="none" stroke="#00B5E2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
  <line x1="8" y1="70" x2="112" y2="70" stroke="#999" stroke-width="1"/>
</svg>`;

// ─── Chart Definition ────────────────────────────────────────────────

export const lineChart: ChartTemplate = {
  id: "line-chart",
  name: "Line Chart",
  description: "Trends over time with connected data points.",
  category: "temporal",
  tags: ["temporal", "trend", "time-series"],
  thumbnail: THUMBNAIL_SVG,

  // ─── Dimensions ──────────────────────────────────────────────────
  dimensions: [
    {
      id: "x",
      name: "X Axis (Time / Categories)",
      description: "The ordered axis — typically time or sequential categories",
      required: true,
      acceptedTypes: ["string", "number", "date"],
      multiple: false,
    },
    {
      id: "y",
      name: "Values (Y Axis)",
      description: "The numeric values for the line heights",
      required: true,
      acceptedTypes: ["number"],
      multiple: false,
    },
    {
      id: "color",
      name: "Color (Series)",
      description: "Optional: split into multiple lines by series",
      required: false,
      acceptedTypes: ["string"],
      multiple: false,
    },
  ],

  // ─── Visual Options ───────────────────────────────────────────────
  visualOptions: [
    {
      id: "showDots",
      name: "Show data points",
      type: "boolean",
      defaultValue: true,
      group: "layout",
    },
    {
      id: "dotRadius",
      name: "Point radius",
      type: "range",
      defaultValue: 3,
      min: 1,
      max: 8,
      step: 0.5,
      group: "layout",
    },
    {
      id: "lineWidth",
      name: "Line width",
      type: "range",
      defaultValue: 2,
      min: 1,
      max: 5,
      step: 0.5,
      group: "layout",
    },
    {
      id: "curveType",
      name: "Curve type",
      type: "select",
      defaultValue: "linear",
      options: [
        { value: "linear", label: "Straight" },
        { value: "monotone", label: "Smooth" },
        { value: "step", label: "Step" },
      ],
      group: "layout",
    },
    {
      id: "showValues",
      name: "Show value labels",
      type: "boolean",
      defaultValue: false,
      group: "layout",
    },
    {
      id: "yAxisStart",
      name: "Y axis starts at zero",
      type: "boolean",
      defaultValue: false,
      group: "axes",
    },
  ],

  // ─── Smart Mapping Suggestions ───────────────────────────────────
  mappingSuggestions: [
    {
      dimensionId: "x",
      columnNamePatterns: [/month/i, /year/i, /date/i, /time/i, /quarter/i, /period/i, /week/i],
    },
    {
      dimensionId: "y",
      columnNamePatterns: [/value/i, /amount/i, /total/i, /revenue/i, /sales/i, /count/i, /profit/i],
    },
    {
      dimensionId: "color",
      columnNamePatterns: [/series/i, /group/i, /category/i, /segment/i, /type/i],
    },
  ],

  // ─── Data Mapping ────────────────────────────────────────────────
  mapData(data: DataRow[], mapping: MappingConfig, _options: ResolvedOptions): MappedData {
    const xCol = mapping.x as string;
    const yCol = mapping.y as string;
    const colorCol = mapping.color as string | undefined;

    if (!xCol || !yCol) return [];

    return data
      .map((row) => ({
        x: String(row[xCol] ?? ""),
        y: typeof row[yCol] === "number" ? row[yCol] : parseNumber(String(row[yCol] ?? "")) ?? 0,
        series: colorCol ? String(row[colorCol] ?? "") : "__default__",
      }))
      .filter((d) => d.x !== "");
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

    const typedData = data as { x: string; y: number; series: string }[];

    // ─── Determine series ──────────────────────────────────────
    const seriesNames = [...new Set(typedData.map((d) => d.series))];
    const xValues = [...new Set(typedData.map((d) => d.x))];
    const hasSeries = seriesNames.length > 1 || seriesNames[0] !== "__default__";

    // ─── Scales ────────────────────────────────────────────────
    const xScale = d3
      .scalePoint()
      .domain(xValues)
      .range([0, plotWidth])
      .padding(0.5);

    const allYValues = typedData.map((d) => d.y);
    const yMin = options.yAxisStart ? 0 : d3.min(allYValues) ?? 0;
    const yMax = d3.max(allYValues) ?? 0;
    const yScale = d3
      .scaleLinear()
      .domain([Math.min(yMin, 0), yMax * 1.05])
      .nice()
      .range([plotHeight, 0]);

    // ─── Color ─────────────────────────────────────────────────
    const palette = theme.colors.palettes.categorical[0]?.colors ?? ["#3b82f6"];
    const colorScale = d3.scaleOrdinal<string>().domain(seriesNames).range(palette);

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

    // ─── Resolve curve factory ─────────────────────────────────
    const curveType = options.curveType as string;
    const curveFactory =
      curveType === "monotone" ? d3.curveMonotoneX
      : curveType === "step" ? d3.curveStepAfter
      : d3.curveLinear;

    const lineWidth = (options.lineWidth as number) ?? 2;

    // ─── Draw lines per series ─────────────────────────────────
    for (const series of seriesNames) {
      const seriesData = typedData
        .filter((d) => d.series === series)
        // Maintain original order based on x position
        .sort((a, b) => xValues.indexOf(a.x) - xValues.indexOf(b.x));

      const lineGen = d3.line<{ x: string; y: number }>()
        .x((d) => xScale(d.x) ?? 0)
        .y((d) => yScale(d.y))
        .curve(curveFactory);

      // Line path
      g.append("path")
        .datum(seriesData)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", colorScale(series))
        .attr("stroke-width", lineWidth)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("d", lineGen);

      // Data points
      if (options.showDots) {
        const dotRadius = (options.dotRadius as number) ?? 3;
        g.selectAll(`.dot-${series}`)
          .data(seriesData)
          .join("circle")
          .attr("class", `dot-${series}`)
          .attr("cx", (d) => xScale(d.x) ?? 0)
          .attr("cy", (d) => yScale(d.y))
          .attr("r", dotRadius)
          .attr("fill", theme.colors.background)
          .attr("stroke", colorScale(series))
          .attr("stroke-width", lineWidth);
      }

      // Value labels
      if (options.showValues) {
        g.selectAll(`.value-${series}`)
          .data(seriesData)
          .join("text")
          .attr("class", `value-${series}`)
          .attr("x", (d) => xScale(d.x) ?? 0)
          .attr("y", (d) => yScale(d.y) - 10)
          .attr("text-anchor", "middle")
          .attr("font-family", theme.typography.fontFamily)
          .attr("font-size", theme.typography.dataLabel.size)
          .attr("font-weight", theme.typography.dataLabel.weight)
          .attr("fill", theme.typography.dataLabel.color)
          .text((d) => d3.format(",.0f")(d.y));
      }
    }

    // ─── Legend (if multiple series) ────────────────────────────
    if (hasSeries) {
      const legend = g.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(0, ${-margin.top / 2})`);

      seriesNames.forEach((name, i) => {
        const item = legend.append("g")
          .attr("transform", `translate(${i * 100}, 0)`);
        item.append("line")
          .attr("x1", 0).attr("x2", 16)
          .attr("y1", 0).attr("y2", 0)
          .attr("stroke", colorScale(name))
          .attr("stroke-width", lineWidth);
        item.append("text")
          .attr("x", 20)
          .attr("dy", "0.35em")
          .attr("font-family", theme.typography.fontFamily)
          .attr("font-size", theme.typography.legend.size)
          .attr("fill", theme.typography.legend.color)
          .text(name);
      });
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
    return "// Code generation not yet implemented for Line Chart.\n// Coming in Phase 2.";
  },
};
