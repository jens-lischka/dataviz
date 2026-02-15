import { useEffect, useRef, useMemo } from "react";
import { useAppStore, availableThemes } from "@/app/store";
import { chartRegistry } from "@/charts/registry";
import { useTheme } from "@/brand/ThemeContext";
import { resolveResponsiveTheme } from "@/brand/ThemeContext";
import type { VisualOptionDefinition } from "@/charts/types";
import type { PreviewBreakpoint } from "@/app/store";

const BREAKPOINT_WIDTHS: Record<string, number> = {
  mobile: 320,
  tablet: 600,
  desktop: 800,
};

export default function Customize() {
  const selectedChartId = useAppStore((s) => s.selectedChartId);
  const parsedData = useAppStore((s) => s.parsedData);
  const mapping = useAppStore((s) => s.mapping);
  const mappedData = useAppStore((s) => s.mappedData);
  const visualOptions = useAppStore((s) => s.visualOptions);
  const setVisualOption = useAppStore((s) => s.setVisualOption);
  const selectedThemeId = useAppStore((s) => s.selectedThemeId);
  const setTheme = useAppStore((s) => s.setTheme);
  const previewBreakpoint = useAppStore((s) => s.previewBreakpoint);
  const setPreviewBreakpoint = useAppStore((s) => s.setPreviewBreakpoint);
  const chartTitle = useAppStore((s) => s.chartTitle);
  const chartSubtitle = useAppStore((s) => s.chartSubtitle);
  const chartSource = useAppStore((s) => s.chartSource);
  const setChartTitle = useAppStore((s) => s.setChartTitle);
  const setChartSubtitle = useAppStore((s) => s.setChartSubtitle);
  const setChartSource = useAppStore((s) => s.setChartSource);
  const setMappedData = useAppStore((s) => s.setMappedData);
  const goToStep = useAppStore((s) => s.goToStep);

  const chart = selectedChartId ? chartRegistry.get(selectedChartId) : undefined;
  const theme = useTheme();

  // Resolved options: chart defaults + user overrides
  const resolvedOptions = useMemo(() => {
    if (!chart) return {};
    const opts: Record<string, unknown> = {};
    for (const opt of chart.visualOptions) {
      opts[opt.id] = visualOptions[opt.id] ?? opt.defaultValue;
    }
    return opts;
  }, [chart, visualOptions]);

  // Recompute mapped data when options change (some charts use options in mapData)
  useEffect(() => {
    if (!chart || !parsedData) return;
    const mapped = chart.mapData(parsedData, mapping, resolvedOptions);
    setMappedData(mapped);
  }, [chart, parsedData, mapping, resolvedOptions, setMappedData]);

  // Preview rendering
  const svgRef = useRef<SVGSVGElement>(null);
  const previewWidth = previewBreakpoint === "responsive"
    ? 800
    : BREAKPOINT_WIDTHS[previewBreakpoint] ?? 800;
  const previewHeight = Math.round(previewWidth * 0.625);

  const renderTheme = useMemo(
    () => resolveResponsiveTheme(theme, previewWidth),
    [theme, previewWidth]
  );

  useEffect(() => {
    if (!svgRef.current || !chart || !mappedData || mappedData.length === 0) return;
    chart.render(svgRef.current, mappedData, resolvedOptions, renderTheme, {
      width: previewWidth,
      height: previewHeight,
    });
  }, [chart, mappedData, resolvedOptions, renderTheme, previewWidth, previewHeight]);

  if (!chart) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-400">
        Please select a chart type first.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-73px)] flex">
      {/* Left sidebar — controls */}
      <div className="w-sidebar flex-shrink-0 border-r border-surface-200 bg-white overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900">Customize</h2>
            <button
              onClick={() => goToStep(3)}
              className="text-sm text-surface-500 hover:text-surface-700"
            >
              Back
            </button>
          </div>

          {/* Theme switcher */}
          <Section title="Theme">
            <select
              value={selectedThemeId}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-surface-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-accent-400"
            >
              {availableThemes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {/* Color preview dots */}
            <div className="flex gap-1 mt-2">
              {theme.colors.palettes.categorical[0]?.colors.slice(0, 6).map((c, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-surface-200"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Section>

          {/* Chart chrome */}
          <Section title="Content">
            <Field label="Title">
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="Chart title"
                className="input-field"
              />
            </Field>
            <Field label="Subtitle">
              <input
                type="text"
                value={chartSubtitle}
                onChange={(e) => setChartSubtitle(e.target.value)}
                placeholder="Optional subtitle"
                className="input-field"
              />
            </Field>
            <Field label="Source">
              <input
                type="text"
                value={chartSource}
                onChange={(e) => setChartSource(e.target.value)}
                placeholder="Data source"
                className="input-field"
              />
            </Field>
          </Section>

          {/* Chart-specific visual options */}
          <VisualOptionsPanel
            options={chart.visualOptions}
            values={resolvedOptions}
            onChange={setVisualOption}
          />

          {/* Continue */}
          <button
            onClick={() => goToStep(5)}
            className="w-full px-5 py-2.5 text-sm font-medium text-white bg-surface-900 rounded-lg
                       hover:bg-surface-800 transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* Right panel — preview */}
      <div className="flex-1 flex flex-col bg-surface-50">
        {/* Breakpoint toggle */}
        <div className="flex items-center justify-center gap-1 py-3 border-b border-surface-200 bg-white">
          {(["mobile", "tablet", "desktop"] as PreviewBreakpoint[]).map((bp) => (
            <button
              key={bp}
              onClick={() => setPreviewBreakpoint(bp)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                previewBreakpoint === bp
                  ? "bg-surface-900 text-white"
                  : "text-surface-500 hover:bg-surface-100"
              }`}
            >
              {bp === "mobile" ? "Mobile" : bp === "tablet" ? "Tablet" : "Desktop"}
              <span className="ml-1 text-2xs opacity-60">{BREAKPOINT_WIDTHS[bp]}px</span>
            </button>
          ))}
        </div>

        {/* Chart preview */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div
            className="bg-white rounded-lg shadow-sm border border-surface-200 transition-all duration-300"
            style={{ width: previewWidth, maxWidth: "100%" }}
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

            {/* SVG chart */}
            <div className="px-2">
              {mappedData && mappedData.length > 0 ? (
                <svg
                  ref={svgRef}
                  width="100%"
                  style={{ aspectRatio: `${previewWidth} / ${previewHeight}` }}
                />
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-surface-400">
                  No data to preview
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
    </div>
  );
}

/** Collapsible section */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/** Labeled field */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-surface-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

/** Auto-generated visual options from chart template */
function VisualOptionsPanel({
  options,
  values,
  onChange,
}: {
  options: VisualOptionDefinition[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
}) {
  // Group options by their group property
  const groups = useMemo(() => {
    const map = new Map<string, VisualOptionDefinition[]>();
    for (const opt of options) {
      if (!map.has(opt.group)) map.set(opt.group, []);
      map.get(opt.group)!.push(opt);
    }
    return map;
  }, [options]);

  const groupLabels: Record<string, string> = {
    layout: "Layout",
    colors: "Colors",
    typography: "Typography",
    axes: "Axes & Grid",
    legend: "Legend",
    interaction: "Interaction",
  };

  return (
    <>
      {Array.from(groups.entries()).map(([group, opts]) => (
        <Section key={group} title={groupLabels[group] ?? group}>
          {opts.map((opt) => (
            <OptionControl
              key={opt.id}
              option={opt}
              value={values[opt.id]}
              onChange={(val) => onChange(opt.id, val)}
            />
          ))}
        </Section>
      ))}
    </>
  );
}

/** Single option control — renders the right input type */
function OptionControl({
  option,
  value,
  onChange,
}: {
  option: VisualOptionDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (option.type) {
    case "boolean":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-surface-300 text-accent-600 focus:ring-accent-400"
          />
          <span className="text-sm text-surface-700">{option.name}</span>
        </label>
      );

    case "select":
      return (
        <Field label={option.name}>
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="input-field"
          >
            {option.options?.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      );

    case "range":
      return (
        <Field label={`${option.name}: ${value}`}>
          <input
            type="range"
            value={value as number}
            min={option.min ?? 0}
            max={option.max ?? 100}
            step={option.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-accent-600"
          />
        </Field>
      );

    case "number":
      return (
        <Field label={option.name}>
          <input
            type="number"
            value={value as number}
            min={option.min}
            max={option.max}
            step={option.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
            className="input-field"
          />
        </Field>
      );

    case "text":
      return (
        <Field label={option.name}>
          <input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="input-field"
          />
        </Field>
      );

    case "color":
      return (
        <Field label={option.name}>
          <input
            type="color"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded border border-surface-200 cursor-pointer"
          />
        </Field>
      );

    default:
      return null;
  }
}
