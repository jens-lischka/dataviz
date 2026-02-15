/**
 * Engine Tests — Parser & Detector
 *
 * These tests verify the core data processing pipeline.
 * Run with: npm test
 */

import { describe, it, expect } from "vitest";
import { parseText } from "@/engine/parser";
import { parseNumber, detectColumnTypes } from "@/engine/detector";
import { groupAndAggregate } from "@/engine/mapper";
import { validateMapping } from "@/engine/validator";
import { columnChart } from "@/charts/column-chart";

// ─── parseNumber ─────────────────────────────────────────────────────

describe("parseNumber", () => {
  it("parses plain integers", () => {
    expect(parseNumber("42")).toBe(42);
    expect(parseNumber("-7")).toBe(-7);
    expect(parseNumber("0")).toBe(0);
  });

  it("parses plain decimals", () => {
    expect(parseNumber("3.14")).toBe(3.14);
    expect(parseNumber("-0.5")).toBe(-0.5);
  });

  it("parses US-style numbers (1,000.50)", () => {
    expect(parseNumber("1,000")).toBe(1000);
    expect(parseNumber("1,234,567.89")).toBe(1234567.89);
    expect(parseNumber("12,345")).toBe(12345);
  });

  it("parses European-style numbers (1.000,50)", () => {
    expect(parseNumber("1.000")).toBe(1000);
    expect(parseNumber("1.234.567,89")).toBe(1234567.89);
    expect(parseNumber("12.345")).toBe(12345);
  });

  it("returns null for non-numbers", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("-")).toBeNull();
    expect(parseNumber("N/A")).toBeNull();
  });
});

// ─── parseText ───────────────────────────────────────────────────────

describe("parseText", () => {
  it("parses CSV with headers", () => {
    const csv = "Name,Value\nAlpha,100\nBeta,200\nGamma,300";
    const result = parseText(csv);

    expect(result.rowCount).toBe(3);
    expect(result.rawHeaders).toEqual(["Name", "Value"]);
    expect(result.columns).toHaveLength(2);
    expect(result.data[0]).toEqual({ Name: "Alpha", Value: "100" });
  });

  it("parses TSV", () => {
    const tsv = "Name\tValue\nAlpha\t100\nBeta\t200";
    const result = parseText(tsv);

    expect(result.rowCount).toBe(2);
    expect(result.rawHeaders).toEqual(["Name", "Value"]);
  });

  it("parses semicolon-separated (common in EU exports)", () => {
    const csv = "Name;Value\nAlpha;100\nBeta;200";
    const result = parseText(csv);

    expect(result.rowCount).toBe(2);
  });

  it("detects column types", () => {
    const csv = "Category,Amount,Date,Active\nWidgets,1234,2024-01-15,true\nGadgets,5678,2024-02-20,false";
    const result = parseText(csv);

    const types = Object.fromEntries(result.columns.map((c) => [c.name, c.detectedType]));
    expect(types.Category).toBe("string");
    expect(types.Amount).toBe("number");
    expect(types.Date).toBe("date");
    expect(types.Active).toBe("boolean");
  });

  it("handles empty input", () => {
    const result = parseText("");
    expect(result.rowCount).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ─── groupAndAggregate ───────────────────────────────────────────────

describe("groupAndAggregate", () => {
  const data = [
    { Region: "North", Sales: "100" },
    { Region: "South", Sales: "200" },
    { Region: "North", Sales: "150" },
    { Region: "South", Sales: "250" },
    { Region: "East", Sales: "300" },
  ];

  it("groups and sums by default", () => {
    const result = groupAndAggregate(data, "Region", "Sales", "sum");
    const north = result.find((d) => d.category === "North");
    const south = result.find((d) => d.category === "South");

    expect(north?.value).toBe(250);
    expect(south?.value).toBe(450);
    expect(result).toHaveLength(3);
  });

  it("can compute mean", () => {
    const result = groupAndAggregate(data, "Region", "Sales", "mean");
    const north = result.find((d) => d.category === "North");

    expect(north?.value).toBe(125);
  });
});

// ─── validateMapping ─────────────────────────────────────────────────

describe("validateMapping", () => {
  const columns = [
    { name: "Category", confirmedType: "string" as const },
    { name: "Value", confirmedType: "number" as const },
  ];

  it("validates a complete mapping", () => {
    const result = validateMapping(
      columnChart.dimensions,
      { x: "Category", y: "Value" },
      columns as any // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("catches missing required dimensions", () => {
    const result = validateMapping(
      columnChart.dimensions,
      { x: "Category" },
      columns as any // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.dimensionId === "y")).toBe(true);
  });
});
