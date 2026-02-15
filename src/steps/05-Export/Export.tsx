import { useEffect, useRef, useMemo, useState } from "react";
import { useAppStore } from "@/app/store";
import { chartRegistry } from "@/charts/registry";
import { useTheme } from "@/brand/ThemeContext";
import { resolveResponsiveTheme } from "@/brand/ThemeContext";
import { downloadSvg, downloadPng } from "@/export/svg";

export default function Export() {
  const selectedChartId = useAppStore((s) => s.selectedChartId);
  const parsedData = useAppStore((s) => s.parsedData);
  const mapping = useAppStore((s) => s.mapping);
  const mappedData = useAppStore((s) => s.mappedData);
  const visualOptions = useAppStore((s) => s.visualOptions);
  const chartTitle = useAppStore((s) => s.chartTitle);
  const chartSubtitle = useAppStore((s) => s.chartSubtitle);
  const chartSource = useAppStore((s) => s.chartSource);
  const exportWidth = useAppStore((s) => s.exportWidth);
  const exportHeight = useAppStore((s) => s.exportHeight);
  const exportScale = useAppStore((s) => s.exportScale);
  const setExportDimensions = useAppStore((s) => s.setExportDimensions);
  const setExportScale = useAppStore((s) => s.setExportScale);
  const setMappedData = useAppStore((s) => s.setMappedData);
  const goToStep = useAppStore((s) => s.goToStep);

  const [downloading, setDownloading] = useState(false);

  const chart = selectedChartId ? chartRegistry.get(selectedChartId) : undefined;
  const theme = useTheme();

  const resolvedOptions = useMemo(() => {
    if (!chart) return {};
    const opts: Record<string, unknown> = {};
    for (const opt of chart.visualOptions) {
      opts[opt.id] = visualOptions[opt.id] ?? opt.defaultValue;
    }
    return opts;
  }, [chart, visualOptions]);

  // Recompute mapped data
  useEffect(() => {
    if (!chart || !parsedData) return;
    const mapped = chart.mapData(parsedData, mapping, resolvedOptions);
    setMappedData(mapped);
  }, [chart, parsedData, mapping, resolvedOptions, setMappedData]);

  // Render the export SVG
  const svgRef = useRef<SVGSVGElement>(null);
  const renderTheme = useMemo(
    () => resolveResponsiveTheme(theme, exportWidth),
    [theme, exportWidth]
  );

  useEffect(() => {
    if (!svgRef.current || !chart || !mappedData || mappedData.length === 0) return;
    chart.render(svgRef.current, mappedData, resolvedOptions, renderTheme, {
      width: exportWidth,
      height: exportHeight,
    });
  }, [chart, mappedData, resolvedOptions, renderTheme, exportWidth, exportHeight]);

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const name = chartTitle ? `${chartTitle.replace(/\s+/g, "-").toLowerCase()}.svg` : "chart.svg";
    downloadSvg(svgRef.current, name);
  };

  const handleDownloadPng = async () => {
    if (!svgRef.current) return;
    setDownloading(true);
    try {
      const name = chartTitle ? `${chartTitle.replace(/\s+/g, "-").toLowerCase()}.png` : "chart.png";
      await downloadPng(svgRef.current, name, exportScale, theme.colors.background);
    } finally {
      setDownloading(false);
    }
  };

  if (!chart) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-400">
        Please complete the previous steps first.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-73px)] flex">
      {/* Left sidebar — export options */}
      <div className="w-sidebar flex-shrink-0 border-r border-surface-200 bg-white overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900">Export</h2>
            <button
              onClick={() => goToStep(4)}
              className="text-sm text-surface-500 hover:text-surface-700"
            >
              Back
            </button>
          </div>

          {/* Dimensions */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
              Dimensions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Width</label>
                <input
                  type="number"
                  value={exportWidth}
                  onChange={(e) => setExportDimensions(Number(e.target.value), exportHeight)}
                  min={200}
                  max={2000}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Height</label>
                <input
                  type="number"
                  value={exportHeight}
                  onChange={(e) => setExportDimensions(exportWidth, Number(e.target.value))}
                  min={100}
                  max={2000}
                  className="input-field"
                />
              </div>
            </div>
            {/* Quick presets */}
            <div className="flex gap-2 mt-2">
              {[
                { label: "16:9", w: 800, h: 450 },
                { label: "4:3", w: 800, h: 600 },
                { label: "Square", w: 600, h: 600 },
                { label: "Wide", w: 1200, h: 500 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => setExportDimensions(p.w, p.h)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    exportWidth === p.w && exportHeight === p.h
                      ? "border-accent-400 bg-accent-50 text-accent-700"
                      : "border-surface-200 text-surface-500 hover:border-surface-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Download */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
              SVG
            </h3>
            <p className="text-xs text-surface-500 mb-3">
              Vector format — editable in Illustrator, scalable to any size.
            </p>
            <button
              onClick={handleDownloadSvg}
              disabled={!mappedData || mappedData.length === 0}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-surface-900 rounded-lg
                         hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Download SVG
            </button>
          </div>

          {/* PNG Download */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
              PNG
            </h3>
            <div className="mb-3">
              <label className="block text-xs font-medium text-surface-600 mb-1">Resolution</label>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setExportScale(s)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      exportScale === s
                        ? "border-accent-400 bg-accent-50 text-accent-700"
                        : "border-surface-200 text-surface-500 hover:border-surface-300"
                    }`}
                  >
                    {s}x
                    <span className="block text-2xs opacity-60">
                      {exportWidth * s} x {exportHeight * s}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleDownloadPng}
              disabled={downloading || !mappedData || mappedData.length === 0}
              className="w-full px-4 py-2.5 text-sm font-medium text-surface-700 bg-surface-100 rounded-lg
                         hover:bg-surface-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {downloading ? "Generating..." : "Download PNG"}
            </button>
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-surface-200">
            <p className="text-xs text-surface-400">
              Chart: {chart.name}
              <br />
              Theme: {theme.name}
              {chartTitle && <><br />Title: {chartTitle}</>}
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — final preview */}
      <div className="flex-1 flex items-center justify-center bg-surface-50 p-8 overflow-auto">
        <div
          className="bg-white rounded-lg shadow-sm border border-surface-200"
          style={{ width: exportWidth, maxWidth: "100%" }}
        >
          {/* Chrome: title, subtitle */}
          {(chartTitle || chartSubtitle) && (
            <div className="px-6 pt-5">
              {chartTitle && (
                <h3
                  className="leading-tight"
                  style={{
                    fontFamily: renderTheme.typography.fontFamily,
                    fontSize: renderTheme.typography.title.size,
                    fontWeight: renderTheme.typography.title.weight,
                    color: renderTheme.typography.title.color,
                  }}
                >
                  {chartTitle}
                </h3>
              )}
              {chartSubtitle && (
                <p
                  className="mt-1"
                  style={{
                    fontFamily: renderTheme.typography.fontFamily,
                    fontSize: renderTheme.typography.subtitle.size,
                    fontWeight: renderTheme.typography.subtitle.weight,
                    color: renderTheme.typography.subtitle.color,
                  }}
                >
                  {chartSubtitle}
                </p>
              )}
            </div>
          )}

          {/* SVG */}
          <div className="px-2">
            {mappedData && mappedData.length > 0 ? (
              <svg
                ref={svgRef}
                width="100%"
                style={{ aspectRatio: `${exportWidth} / ${exportHeight}` }}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-surface-400">
                No data to export
              </div>
            )}
          </div>

          {/* Chrome: source */}
          {chartSource && (
            <div className="px-6 pb-4">
              <p
                style={{
                  fontFamily: renderTheme.typography.fontFamily,
                  fontSize: renderTheme.typography.footer.size,
                  fontWeight: renderTheme.typography.footer.weight,
                  color: renderTheme.typography.footer.color,
                }}
              >
                Source: {chartSource}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
