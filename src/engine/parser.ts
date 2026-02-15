/**
 * Data Parser
 *
 * Parses tabular data from CSV/TSV strings and file uploads.
 * Uses PapaParse for the heavy lifting, with custom post-processing
 * for European number formats and type detection.
 *
 * IMPORTANT: PapaParse's dynamicTyping is DISABLED intentionally.
 * We handle type conversion ourselves in detector.ts to correctly
 * handle European number formats (1.000,50 vs 1,000.50).
 */

import Papa from "papaparse";
import type { DataRow, ColumnMeta } from "@/charts/types";
import { detectColumnTypes } from "./detector";

export interface ParseResult {
  data: DataRow[];
  columns: ColumnMeta[];
  rawHeaders: string[];
  rowCount: number;
  errors: string[];
}

/**
 * Parse a raw text string (CSV, TSV, or semicolon-separated).
 * Auto-detects the delimiter.
 */
export function parseText(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { data: [], columns: [], rawHeaders: [], rowCount: 0, errors: ["Empty input"] };
  }

  const result = Papa.parse<Record<string, string>>(trimmed, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false, // We handle type conversion ourselves
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return {
      data: [],
      columns: [],
      rawHeaders: [],
      rowCount: 0,
      errors: result.errors.map((e) => `Row ${e.row}: ${e.message}`),
    };
  }

  const headers = result.meta.fields ?? [];
  const data = result.data as DataRow[];
  const columns = detectColumnTypes(data, headers);
  const errors = result.errors.map((e) => `Row ${e.row}: ${e.message}`);

  return {
    data,
    columns,
    rawHeaders: headers,
    rowCount: data.length,
    errors,
  };
}

/**
 * Parse a File object (CSV, TSV, or XLSX).
 * For XLSX files, uses SheetJS — import dynamically to keep bundle small.
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "xlsx" || extension === "xls") {
    return parseExcel(file);
  }

  // CSV/TSV: read as text and parse
  const text = await file.text();
  return parseText(text);
}

/**
 * Parse Excel files using SheetJS (dynamically imported).
 */
async function parseExcel(file: File): Promise<ParseResult> {
  try {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    // Use first sheet by default
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to CSV, then parse with PapaParse for consistency
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return parseText(csv);
  } catch (error) {
    return {
      data: [],
      columns: [],
      rawHeaders: [],
      rowCount: 0,
      errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`],
    };
  }
}
