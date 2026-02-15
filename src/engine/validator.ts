/**
 * Mapping Validator
 *
 * Checks whether the user's current mapping satisfies
 * the selected chart's dimension requirements.
 */

import type { DimensionDefinition, MappingConfig, ColumnMeta, DataType } from "@/charts/types";

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  dimensionId: string;
  message: string;
}

export interface ValidationWarning {
  dimensionId: string;
  message: string;
}

/**
 * Validate a mapping against a chart's dimension definitions.
 */
export function validateMapping(
  dimensions: DimensionDefinition[],
  mapping: MappingConfig,
  columns: ColumnMeta[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const dim of dimensions) {
    const mapped = mapping[dim.id];

    // Check required dimensions
    if (dim.required && (!mapped || (Array.isArray(mapped) && mapped.length === 0))) {
      errors.push({
        dimensionId: dim.id,
        message: `"${dim.name}" is required.`,
      });
      continue;
    }

    if (!mapped) continue;

    // Check type compatibility
    const columnNames = Array.isArray(mapped) ? mapped : [mapped];
    for (const colName of columnNames) {
      const col = columns.find((c) => c.name === colName);
      if (!col) {
        errors.push({
          dimensionId: dim.id,
          message: `Column "${colName}" not found in data.`,
        });
        continue;
      }

      if (!dim.acceptedTypes.includes(col.confirmedType)) {
        warnings.push({
          dimensionId: dim.id,
          message: `"${colName}" is ${col.confirmedType}, but "${dim.name}" expects ${dim.acceptedTypes.join(" or ")}.`,
        });
      }
    }

    // Check multiple columns
    if (!dim.multiple && Array.isArray(mapped) && mapped.length > 1) {
      errors.push({
        dimensionId: dim.id,
        message: `"${dim.name}" accepts only one column.`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a column type is compatible with a dimension's accepted types.
 */
export function isTypeCompatible(
  columnType: DataType,
  acceptedTypes: DataType[]
): boolean {
  return acceptedTypes.includes(columnType);
}
