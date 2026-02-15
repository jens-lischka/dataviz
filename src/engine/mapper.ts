/**
 * Data Mapper
 *
 * Takes parsed data + user's mapping config and produces a dataset
 * shaped for chart rendering. Each chart template defines its own
 * mapData function, but this module provides shared utilities.
 */

import type { DataRow, MappingConfig, MappedData, AggregationType } from "@/charts/types";
import { parseNumber } from "./detector";

/**
 * Extract values for a mapped dimension from the data.
 * Handles both single-column and multi-column mappings.
 */
export function extractColumn(
  data: DataRow[],
  mapping: MappingConfig,
  dimensionId: string
): (string | number | null)[] {
  const columnName = mapping[dimensionId];
  if (!columnName || Array.isArray(columnName)) return [];

  return data.map((row) => {
    const raw = row[columnName];
    if (raw == null || raw === "") return null;
    return typeof raw === "number" ? raw : String(raw);
  });
}

/**
 * Extract numeric values, parsing European formats.
 */
export function extractNumericColumn(
  data: DataRow[],
  mapping: MappingConfig,
  dimensionId: string
): (number | null)[] {
  const columnName = mapping[dimensionId];
  if (!columnName || Array.isArray(columnName)) return [];

  return data.map((row) => {
    const raw = row[columnName];
    if (raw == null || raw === "") return null;
    if (typeof raw === "number") return raw;
    return parseNumber(String(raw));
  });
}

/**
 * Aggregate an array of numbers using the specified method.
 */
export function aggregate(values: number[], method: AggregationType): number {
  if (values.length === 0) return 0;

  switch (method) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "mean":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "median": {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    case "count":
      return values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

/**
 * Group data rows by a categorical column and aggregate a numeric column.
 * This is the most common data transformation for simple charts.
 */
export function groupAndAggregate(
  data: DataRow[],
  categoryColumn: string,
  valueColumn: string,
  aggregation: AggregationType = "sum"
): MappedData {
  const groups = new Map<string, number[]>();

  for (const row of data) {
    const category = String(row[categoryColumn] ?? "");
    const rawValue = row[valueColumn];
    const value = typeof rawValue === "number" ? rawValue : parseNumber(String(rawValue ?? ""));

    if (value === null) continue;

    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(value);
  }

  return Array.from(groups.entries()).map(([category, values]) => ({
    category,
    value: aggregate(values, aggregation),
  }));
}
