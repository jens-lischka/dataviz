import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { useAppStore } from "@/app/store";
import { chartRegistry } from "@/charts/registry";
import { validateMapping } from "@/engine/validator";
import type { ColumnMeta, DimensionDefinition, DataType } from "@/charts/types";
import { useTheme } from "@/brand/ThemeContext";

export default function Mapping() {
  const columns = useAppStore((s) => s.columns);
  const parsedData = useAppStore((s) => s.parsedData);
  const selectedChartId = useAppStore((s) => s.selectedChartId);
  const mapping = useAppStore((s) => s.mapping);
  const setMapping = useAppStore((s) => s.setMapping);
  const clearMapping = useAppStore((s) => s.clearMapping);
  const setMappedData = useAppStore((s) => s.setMappedData);
  const goToStep = useAppStore((s) => s.goToStep);
  const visualOptions = useAppStore((s) => s.visualOptions);

  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const chart = selectedChartId ? chartRegistry.get(selectedChartId) : undefined;
  const theme = useTheme();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Validation
  const validation = useMemo(() => {
    if (!chart || !columns) return { isValid: false, errors: [], warnings: [] };
    return validateMapping(chart.dimensions, mapping, columns);
  }, [chart, columns, mapping]);

  // Which columns are already mapped
  const mappedColumns = useMemo(() => {
    const set = new Set<string>();
    for (const val of Object.values(mapping)) {
      if (Array.isArray(val)) val.forEach((v) => set.add(v));
      else if (val) set.add(val);
    }
    return set;
  }, [mapping]);

  // Compute mapped data when mapping is valid
  useEffect(() => {
    if (!chart || !parsedData || !validation.isValid) return;
    // Build resolved options from chart defaults + user overrides
    const resolved: Record<string, unknown> = {};
    for (const opt of chart.visualOptions) {
      resolved[opt.id] = visualOptions[opt.id] ?? opt.defaultValue;
    }
    const mapped = chart.mapData(parsedData, mapping, resolved);
    setMappedData(mapped);
  }, [chart, parsedData, mapping, validation.isValid, setMappedData, visualOptions]);

  // Preview rendering
  const svgRef = useRef<SVGSVGElement>(null);
  const mappedData = useAppStore((s) => s.mappedData);

  useEffect(() => {
    if (!svgRef.current || !chart || !mappedData || mappedData.length === 0) return;
    const resolved: Record<string, unknown> = {};
    for (const opt of chart.visualOptions) {
      resolved[opt.id] = visualOptions[opt.id] ?? opt.defaultValue;
    }
    chart.render(svgRef.current, mappedData, resolved, theme, { width: 480, height: 300 });
  }, [chart, mappedData, theme, visualOptions]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveColumn(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveColumn(null);
      const { active, over } = event;
      if (!over) return;

      const columnName = active.id as string;
      const dimensionId = over.id as string;
      setMapping(dimensionId, columnName);
    },
    [setMapping]
  );

  if (!chart || !columns) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-400">
        Please select a chart type first.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-[calc(100vh-73px)] flex">
        {/* Left panel: columns + dimension slots */}
        <div className="w-sidebar flex-shrink-0 border-r border-surface-200 bg-white overflow-y-auto scrollbar-thin">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-surface-900">Map Data</h2>
              <button
                onClick={() => goToStep(2)}
                className="text-sm text-surface-500 hover:text-surface-700"
              >
                Back
              </button>
            </div>

            {/* Available columns */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
                Data Columns
              </h3>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <DraggableColumn
                    key={col.name}
                    column={col}
                    isMapped={mappedColumns.has(col.name)}
                  />
                ))}
              </div>
            </div>

            {/* Dimension slots */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">
                Chart Dimensions
              </h3>
              {chart.dimensions.map((dim) => {
                const mapped = mapping[dim.id] as string | undefined;
                const col = mapped ? columns.find((c) => c.name === mapped) : undefined;
                return (
                  <DimensionSlot
                    key={dim.id}
                    dimension={dim}
                    mappedColumn={col}
                    activeColumn={activeColumn}
                    columns={columns}
                    onClear={() => clearMapping(dim.id)}
                  />
                );
              })}
            </div>

            {/* Validation */}
            {validation.errors.length > 0 && (
              <div className="mt-6 space-y-1">
                {validation.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <span className="mt-px">!</span> {e.message}
                  </p>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {validation.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-600 flex items-start gap-1.5">
                    <span className="mt-px">~</span> {w.message}
                  </p>
                ))}
              </div>
            )}

            {/* Continue button */}
            <div className="mt-8">
              <button
                onClick={() => goToStep(4)}
                disabled={!validation.isValid}
                className="w-full px-5 py-2.5 text-sm font-medium text-white bg-surface-900 rounded-lg
                           hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {validation.isValid ? "Customize Chart" : "Map required dimensions to continue"}
              </button>
            </div>
          </div>
        </div>

        {/* Right panel: preview */}
        <div className="flex-1 flex items-center justify-center bg-surface-50 p-8">
          {mappedData && mappedData.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-surface-200 p-6">
              <svg ref={svgRef} className="w-full max-w-[480px]" />
            </div>
          ) : (
            <div className="text-center text-surface-400">
              <p className="text-sm">Map your data columns to see a preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeColumn ? (
          <div className="column-chip column-chip-string shadow-lg scale-105">
            {activeColumn}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DraggableColumn({ column, isMapped }: { column: ColumnMeta; isMapped: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: column.name,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        column-chip column-chip-${column.confirmedType}
        ${isDragging ? "opacity-50" : ""}
        ${isMapped ? "ring-2 ring-accent-400 ring-offset-1" : ""}
      `}
    >
      <TypeIcon type={column.confirmedType} />
      {column.name}
    </div>
  );
}

function DimensionSlot({
  dimension,
  mappedColumn,
  activeColumn,
  columns,
  onClear,
}: {
  dimension: DimensionDefinition;
  mappedColumn: ColumnMeta | undefined;
  activeColumn: string | null;
  columns: ColumnMeta[];
  onClear: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: dimension.id });

  // Check if the currently dragged column is compatible
  const activeCol = activeColumn ? columns.find((c) => c.name === activeColumn) : undefined;
  const isCompatible = activeCol
    ? dimension.acceptedTypes.includes(activeCol.confirmedType)
    : false;

  const showHighlight = activeColumn && isCompatible;

  return (
    <div
      ref={setNodeRef}
      className={`
        dimension-slot
        ${mappedColumn ? "dimension-slot-filled" : ""}
        ${isOver && isCompatible ? "dimension-slot-active" : ""}
        ${showHighlight && !isOver ? "border-accent-200" : ""}
        ${activeColumn && !isCompatible ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-surface-600">
          {dimension.name}
          {dimension.required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
        {mappedColumn && (
          <button
            onClick={onClear}
            className="text-xs text-surface-400 hover:text-surface-600"
          >
            Remove
          </button>
        )}
      </div>
      {mappedColumn ? (
        <span className={`column-chip column-chip-${mappedColumn.confirmedType}`}>
          <TypeIcon type={mappedColumn.confirmedType} />
          {mappedColumn.name}
        </span>
      ) : (
        <p className="text-xs text-surface-400">
          {dimension.description}
        </p>
      )}
    </div>
  );
}

function TypeIcon({ type }: { type: DataType }) {
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
