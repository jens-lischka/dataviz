import { useState, useRef, useCallback } from "react";
import { useAppStore } from "@/app/store";
import { parseText, parseFile } from "@/engine/parser";
import { sampleDatasets } from "@/utils/sampleData";
import type { DataRow, ColumnMeta } from "@/charts/types";

type Tab = "paste" | "upload" | "samples";

export default function DataInput() {
  const setData = useAppStore((s) => s.setData);
  const parsedData = useAppStore((s) => s.parsedData);
  const columns = useAppStore((s) => s.columns);
  const dataSource = useAppStore((s) => s.dataSource);
  const fileName = useAppStore((s) => s.fileName);
  const clearData = useAppStore((s) => s.clearData);

  const [tab, setTab] = useState<Tab>("paste");
  const [pasteValue, setPasteValue] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = useCallback(
    (text: string, source: "paste" | "sample", name?: string) => {
      const result = parseText(text);
      if (result.data.length === 0) {
        setParseErrors(result.errors.length ? result.errors : ["No data found"]);
        return;
      }
      setParseErrors(result.errors);
      setData(text, result.data, result.columns, source, name);
    },
    [setData]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      const result = await parseFile(file);
      if (result.data.length === 0) {
        setParseErrors(result.errors.length ? result.errors : ["No data found in file"]);
        return;
      }
      setParseErrors(result.errors);
      const raw = result.data
        .map((row) => Object.values(row).join(","))
        .join("\n");
      setData(raw, result.data, result.columns, "file", file.name);
    },
    [setData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  // If data is already loaded, show the preview with option to start over
  if (parsedData && columns) {
    return (
      <DataPreview
        data={parsedData}
        columns={columns}
        source={dataSource}
        fileName={fileName}
        onClear={clearData}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-surface-900 mb-2">
          Upload Your Data
        </h2>
        <p className="text-surface-500">
          Paste from a spreadsheet, upload a CSV file, or try a sample dataset.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 mb-6 bg-surface-100 rounded-lg p-1 w-fit">
        {([
          { id: "paste" as Tab, label: "Paste Data" },
          { id: "upload" as Tab, label: "Upload File" },
          { id: "samples" as Tab, label: "Sample Data" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.id
                ? "bg-white text-surface-900 shadow-sm"
                : "text-surface-500 hover:text-surface-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Paste tab */}
      {tab === "paste" && (
        <div className="space-y-4">
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder={`Paste CSV or tab-separated data here...\n\nExample:\nCategory,Value\nAlpha,120\nBeta,340\nGamma,210`}
            className="w-full h-56 px-4 py-3 text-sm font-mono bg-white border border-surface-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent
                       placeholder:text-surface-400 resize-y"
          />
          <button
            onClick={() => handleParse(pasteValue, "paste")}
            disabled={!pasteValue.trim()}
            className="px-6 py-2.5 text-sm font-medium text-white bg-surface-900 rounded-lg
                       hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Parse Data
          </button>
        </div>
      )}

      {/* Upload tab */}
      {tab === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? "border-accent-400 bg-accent-50"
              : "border-surface-300 hover:border-surface-400"
          }`}
        >
          <div className="text-surface-400 mb-4">
            <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-surface-600 mb-1 font-medium">
            Drop a file here or{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-accent-600 hover:text-accent-700 underline"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-surface-400">CSV, TSV, or XLSX</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.xlsx,.xls,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>
      )}

      {/* Sample datasets tab */}
      {tab === "samples" && (
        <div className="grid gap-3">
          {sampleDatasets.map((ds) => (
            <button
              key={ds.id}
              onClick={() => handleParse(ds.csv, "sample", ds.name)}
              className="text-left px-5 py-4 bg-white border border-surface-200 rounded-lg
                         hover:border-surface-300 hover:shadow-sm transition-all group"
            >
              <div className="font-medium text-surface-900 group-hover:text-accent-600 transition-colors">
                {ds.name}
              </div>
              <div className="text-sm text-surface-500 mt-0.5">{ds.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-1">Parse errors</p>
          {parseErrors.slice(0, 3).map((err, i) => (
            <p key={i} className="text-xs text-red-600">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function DataPreview({
  data,
  columns,
  source,
  fileName,
  onClear,
}: {
  data: DataRow[];
  columns: ColumnMeta[];
  source: string | null;
  fileName: string | null;
  onClear: () => void;
}) {
  const goToStep = useAppStore((s) => s.goToStep);
  const maxRows = 10;
  const displayData = data.slice(0, maxRows);
  const headers = columns.map((c) => c.name);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-surface-900 mb-1">
            Data Loaded
          </h2>
          <p className="text-sm text-surface-500">
            {data.length} rows, {columns.length} columns
            {source === "file" && fileName && <> from <span className="font-medium">{fileName}</span></>}
            {source === "sample" && fileName && <> ({fileName})</>}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
          >
            Start Over
          </button>
          <button
            onClick={() => goToStep(2)}
            className="px-5 py-2 text-sm font-medium text-white bg-surface-900 rounded-lg hover:bg-surface-800 transition-colors"
          >
            Choose Chart Type
          </button>
        </div>
      </div>

      {/* Column type badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {columns.map((col) => (
          <span key={col.name} className={`column-chip column-chip-${col.detectedType}`}>
            <TypeIcon type={col.detectedType} />
            {col.name}
          </span>
        ))}
      </div>

      {/* Data table */}
      <div className="border border-surface-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider border-b border-surface-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i} className="border-b border-surface-100 last:border-0 hover:bg-surface-50">
                  {headers.map((h) => (
                    <td key={h} className="px-4 py-2 text-surface-700 font-mono text-xs">
                      {row[h] != null ? String(row[h]) : <span className="text-surface-300">null</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > maxRows && (
          <div className="px-4 py-2 text-xs text-surface-400 bg-surface-50 border-t border-surface-200">
            Showing {maxRows} of {data.length} rows
          </div>
        )}
      </div>
    </div>
  );
}

function TypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    string: "Aa",
    number: "#",
    date: "D",
    boolean: "?",
  };
  return (
    <span className="text-2xs font-bold opacity-70">{icons[type] ?? "?"}</span>
  );
}
