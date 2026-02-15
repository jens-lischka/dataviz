/**
 * Column Type Detector
 *
 * Analyzes parsed data columns to detect their types.
 * Handles both US (1,000.50) and European (1.000,50) number formats.
 *
 * Detection strategy:
 * 1. Sample the first N rows (default 100)
 * 2. For each column, test values against type patterns
 * 3. Use majority voting to determine the final type
 * 4. User can override detected types in the UI
 */

import type { DataRow, DataType, ColumnMeta } from "@/charts/types";

const SAMPLE_SIZE = 100;

/** Patterns for European-style numbers: 1.000,50 or 1000,50 */
const EU_NUMBER_PATTERN = /^-?\d{1,3}(\.\d{3})*(,\d+)?$/;
/** Patterns for US-style numbers: 1,000.50 or 1000.50 */
const US_NUMBER_PATTERN = /^-?\d{1,3}(,\d{3})*(\.\d+)?$/;
/** Plain integer or float */
const PLAIN_NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

/** Common date patterns */
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/, // ISO: 2024-01-15
  /^\d{2}\/\d{2}\/\d{4}$/, // US: 01/15/2024
  /^\d{2}\.\d{2}\.\d{4}$/, // EU: 15.01.2024
  /^\d{2}-\d{2}-\d{4}$/, // Alt: 15-01-2024
  /^\d{4}\/\d{2}\/\d{2}$/, // JP: 2024/01/15
];

const BOOLEAN_VALUES = new Set([
  "true",
  "false",
  "yes",
  "no",
  "1",
  "0",
  "ja",
  "nein",
  "oui",
  "non",
]);

/**
 * Detect types for all columns in the dataset.
 */
export function detectColumnTypes(data: DataRow[], headers: string[]): ColumnMeta[] {
  const sample = data.slice(0, SAMPLE_SIZE);

  return headers.map((name) => {
    const values = sample.map((row) => row[name]).filter((v) => v != null && v !== "");
    const detectedType = detectSingleColumnType(values as (string | number | boolean)[]);

    // Compute stats
    const allValues = data.map((row) => row[name]);
    const nullCount = allValues.filter((v) => v == null || v === "").length;
    const uniqueValues = new Set(allValues.filter((v) => v != null && v !== "")).size;
    const sampleValues = values.slice(0, 5);

    const meta: ColumnMeta = {
      name,
      detectedType,
      confirmedType: detectedType,
      uniqueValues,
      nullCount,
      sampleValues: sampleValues as (string | number | boolean | Date | null)[],
    };

    // Number stats
    if (detectedType === "number") {
      const nums = allValues
        .map((v) => parseNumber(String(v ?? "")))
        .filter((n): n is number => n !== null);
      if (nums.length > 0) {
        meta.min = Math.min(...nums);
        meta.max = Math.max(...nums);
        meta.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      }
    }

    return meta;
  });
}

/**
 * Detect the type of a single column from its sampled values.
 */
function detectSingleColumnType(values: (string | number | boolean)[]): DataType {
  if (values.length === 0) return "string";

  const stringValues = values.map((v) => String(v).trim());

  // Check boolean first (most specific)
  const boolCount = stringValues.filter((v) => BOOLEAN_VALUES.has(v.toLowerCase())).length;
  if (boolCount / stringValues.length > 0.8) return "boolean";

  // Check date patterns
  const dateCount = stringValues.filter((v) => DATE_PATTERNS.some((p) => p.test(v))).length;
  if (dateCount / stringValues.length > 0.8) return "date";

  // Check number (including European format)
  const numberCount = stringValues.filter((v) => parseNumber(v) !== null).length;
  if (numberCount / stringValues.length > 0.8) return "number";

  return "string";
}

/**
 * Parse a string as a number, handling both US and European formats.
 * Returns null if the value is not a valid number.
 */
export function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "-") return null;

  // Plain number (no thousand separators)
  if (PLAIN_NUMBER_PATTERN.test(trimmed)) {
    const n = Number(trimmed);
    return isNaN(n) ? null : n;
  }

  // European format: 1.000,50 → 1000.50
  if (EU_NUMBER_PATTERN.test(trimmed)) {
    const normalized = trimmed.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return isNaN(n) ? null : n;
  }

  // US format: 1,000.50 → 1000.50
  if (US_NUMBER_PATTERN.test(trimmed)) {
    const normalized = trimmed.replace(/,/g, "");
    const n = Number(normalized);
    return isNaN(n) ? null : n;
  }

  // Try native parsing as fallback
  const n = Number(trimmed);
  return isNaN(n) ? null : n;
}
