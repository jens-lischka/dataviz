import { useAppStore } from "@/app/store";
import { chartRegistry } from "@/charts/registry";
import type { ChartTemplate, ChartCategory } from "@/charts/types";

/** Placeholder chart types shown as "coming soon" */
const UPCOMING_CHARTS: { id: string; name: string; category: ChartCategory; description: string; thumbnail: string }[] = [
  {
    id: "bar-chart",
    name: "Bar Chart",
    category: "comparison",
    description: "Horizontal bars — great for long category labels.",
    thumbnail: `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="55" height="12" rx="2" fill="#999" opacity="0.4"/><rect x="8" y="24" width="85" height="12" rx="2" fill="#999" opacity="0.4"/><rect x="8" y="40" width="65" height="12" rx="2" fill="#999" opacity="0.4"/><rect x="8" y="56" width="100" height="12" rx="2" fill="#999" opacity="0.4"/></svg>`,
  },
  {
    id: "line-chart",
    name: "Line Chart",
    category: "temporal",
    description: "Trends over time with connected data points.",
    thumbnail: `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg"><polyline points="10,60 30,40 50,50 70,25 90,35 110,15" fill="none" stroke="#999" stroke-width="2.5" opacity="0.4"/><line x1="8" y1="70" x2="112" y2="70" stroke="#999" stroke-width="1" opacity="0.3"/></svg>`,
  },
  {
    id: "pie-chart",
    name: "Pie Chart",
    category: "composition",
    description: "Proportions of a whole.",
    thumbnail: `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="40" r="30" fill="none" stroke="#999" stroke-width="20" opacity="0.3"/></svg>`,
  },
  {
    id: "stacked-column",
    name: "Stacked Column",
    category: "composition",
    description: "Composition within categories.",
    thumbnail: `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="30" width="20" height="20" rx="1" fill="#999" opacity="0.3"/><rect x="15" y="50" width="20" height="25" rx="1" fill="#999" opacity="0.5"/><rect x="50" y="10" width="20" height="30" rx="1" fill="#999" opacity="0.3"/><rect x="50" y="40" width="20" height="35" rx="1" fill="#999" opacity="0.5"/><rect x="85" y="25" width="20" height="20" rx="1" fill="#999" opacity="0.3"/><rect x="85" y="45" width="20" height="30" rx="1" fill="#999" opacity="0.5"/></svg>`,
  },
  {
    id: "area-chart",
    name: "Area Chart",
    category: "temporal",
    description: "Volume and trend over time.",
    thumbnail: `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg"><polygon points="10,70 30,50 50,55 70,30 90,40 110,20 110,70" fill="#999" opacity="0.2"/><polyline points="10,70 30,50 50,55 70,30 90,40 110,20" fill="none" stroke="#999" stroke-width="2" opacity="0.4"/></svg>`,
  },
];

export default function ChartSelect() {
  const columns = useAppStore((s) => s.columns);
  const selectedChartId = useAppStore((s) => s.selectedChartId);
  const selectChart = useAppStore((s) => s.selectChart);
  const goToStep = useAppStore((s) => s.goToStep);

  const availableCharts = chartRegistry.getAll();
  const compatibleIds = columns
    ? new Set(chartRegistry.getCompatible(columns).map((c) => c.id))
    : new Set(availableCharts.map((c) => c.id));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-surface-900 mb-2">
            Choose a Chart Type
          </h2>
          <p className="text-surface-500">
            Select the visualization that best fits your data.
          </p>
        </div>
        <button
          onClick={() => goToStep(1)}
          className="px-4 py-2 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
        >
          Back
        </button>
      </div>

      {/* Available charts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {availableCharts.map((chart) => (
          <ChartCard
            key={chart.id}
            chart={chart}
            isCompatible={compatibleIds.has(chart.id)}
            isSelected={selectedChartId === chart.id}
            onSelect={() => selectChart(chart.id)}
          />
        ))}
      </div>

      {/* Coming soon */}
      {UPCOMING_CHARTS.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
            Coming Soon
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {UPCOMING_CHARTS.filter((u) => !availableCharts.some((a) => a.id === u.id)).map((chart) => (
              <div
                key={chart.id}
                className="relative p-4 bg-surface-50 border border-surface-200 rounded-lg opacity-50 cursor-not-allowed"
              >
                <div
                  className="w-full h-16 mb-3 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: chart.thumbnail }}
                />
                <div className="text-sm font-medium text-surface-500">{chart.name}</div>
                <div className="text-xs text-surface-400 mt-0.5">{chart.description}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChartCard({
  chart,
  isCompatible,
  isSelected,
  onSelect,
}: {
  chart: ChartTemplate;
  isCompatible: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={!isCompatible}
      className={`
        text-left p-4 rounded-lg border-2 transition-all
        ${isSelected
          ? "border-accent-500 bg-accent-50 shadow-sm"
          : isCompatible
            ? "border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm"
            : "border-surface-100 bg-surface-50 opacity-50 cursor-not-allowed"
        }
      `}
    >
      <div
        className="w-full h-16 mb-3 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
        dangerouslySetInnerHTML={{ __html: chart.thumbnail }}
      />
      <div className="text-sm font-medium text-surface-900">{chart.name}</div>
      <div className="text-xs text-surface-500 mt-0.5">{chart.description}</div>
      {!isCompatible && (
        <div className="text-xs text-amber-600 mt-1">Not compatible with data</div>
      )}
    </button>
  );
}
