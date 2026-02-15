/**
 * App Shell
 *
 * Manages the 5-step workflow navigation and renders the active step.
 * Wraps the app in ThemeProvider for chart-level theming.
 */

import { useAppStore } from "./store";
import { ThemeProvider } from "@/brand/ThemeContext";
import DataInput from "@/steps/01-DataInput/DataInput";
import ChartSelect from "@/steps/02-ChartSelect/ChartSelect";
import Mapping from "@/steps/03-Mapping/Mapping";
import Customize from "@/steps/04-Customize/Customize";
import Export from "@/steps/05-Export/Export";

const STEPS = [
  { number: 1, label: "Data", short: "Upload" },
  { number: 2, label: "Chart", short: "Select" },
  { number: 3, label: "Map", short: "Dimensions" },
  { number: 4, label: "Customize", short: "Style" },
  { number: 5, label: "Export", short: "Download" },
] as const;

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

function AppShell() {
  const currentStep = useAppStore((s) => s.currentStep);
  const maxReachedStep = useAppStore((s) => s.maxReachedStep);
  const goToStep = useAppStore((s) => s.goToStep);

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      {/* Header */}
      <header className="border-b border-surface-200 bg-white sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-surface-900">
            Chart Builder
          </h1>

          {/* Step Navigation */}
          <nav className="flex items-center gap-1">
            {STEPS.map((step, i) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;
              const isReachable = step.number <= maxReachedStep;

              return (
                <div key={step.number} className="flex items-center">
                  {i > 0 && (
                    <div
                      className={`w-8 h-px mx-1 ${
                        step.number <= maxReachedStep
                          ? "bg-surface-300"
                          : "bg-surface-200"
                      }`}
                    />
                  )}
                  <button
                    onClick={() => isReachable && goToStep(step.number)}
                    disabled={!isReachable}
                    className={`
                      step-pill
                      ${isActive ? "step-pill-active" : ""}
                      ${isCompleted ? "step-pill-completed" : ""}
                      ${!isActive && !isCompleted ? "step-pill-upcoming" : ""}
                    `}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.short}</span>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Step Content */}
      <main className="flex-1">
        <StepContent step={currentStep} />
      </main>
    </div>
  );
}

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1:
      return <DataInput />;
    case 2:
      return <ChartSelect />;
    case 3:
      return <Mapping />;
    case 4:
      return <Customize />;
    case 5:
      return <Export />;
    default:
      return null;
  }
}
