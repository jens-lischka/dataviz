/**
 * App Shell
 *
 * Manages the 5-step workflow navigation and renders the active step.
 * Step components are lazy-loaded for code splitting.
 */

import { useAppStore } from "./store";

const STEPS = [
  { number: 1, label: "Data", short: "Upload" },
  { number: 2, label: "Chart", short: "Select" },
  { number: 3, label: "Map", short: "Dimensions" },
  { number: 4, label: "Customize", short: "Style" },
  { number: 5, label: "Export", short: "Download" },
] as const;

export default function App() {
  const currentStep = useAppStore((s) => s.currentStep);
  const maxReachedStep = useAppStore((s) => s.maxReachedStep);
  const goToStep = useAppStore((s) => s.goToStep);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-200 bg-white">
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

/**
 * Renders the component for the current step.
 * TODO: Replace placeholders with actual step components as they're built.
 */
function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1:
      return <StepPlaceholder step={1} title="Upload Your Data" description="Paste data from a spreadsheet, upload a CSV/XLSX file, or choose a sample dataset." />;
    case 2:
      return <StepPlaceholder step={2} title="Choose a Chart Type" description="Select the visualization that best fits your data and story." />;
    case 3:
      return <StepPlaceholder step={3} title="Map Your Data" description="Drag data columns to chart dimensions (axes, colors, sizes)." />;
    case 4:
      return <StepPlaceholder step={4} title="Customize" description="Switch themes, adjust colors, typography, and preview at different screen sizes." />;
    case 5:
      return <StepPlaceholder step={5} title="Export" description="Download as SVG, PNG, or copy interactive code." />;
    default:
      return null;
  }
}

/** Temporary placeholder for steps not yet implemented */
function StepPlaceholder({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  const goToStep = useAppStore((s) => s.goToStep);
  const maxReachedStep = useAppStore((s) => s.maxReachedStep);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-surface-500 text-lg font-semibold mb-4">
        {step}
      </div>
      <h2 className="text-2xl font-semibold text-surface-900 mb-2">{title}</h2>
      <p className="text-surface-500 max-w-md mb-8">{description}</p>

      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => goToStep(step - 1)}
            className="px-5 py-2.5 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
          >
            ← Back
          </button>
        )}
        {step < 5 && (
          <button
            onClick={() => {
              // For prototyping: allow advancing even without real data
              useAppStore.setState({
                currentStep: step + 1,
                maxReachedStep: Math.max(maxReachedStep, step + 1),
              });
            }}
            className="px-5 py-2.5 text-sm font-medium text-white bg-surface-900 rounded-lg hover:bg-surface-800 transition-colors"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
