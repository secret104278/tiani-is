/**
 * NumberField - Number input with FormField wrapper
 *
 * Combines FormField with a number input for consistent styling,
 * validation error display, and proper mobile keyboard (inputMode).
 *
 * Usage:
 * ```tsx
 * <NumberField
 *   label="人數"
 *   required
 *   error={errors.headcount?.message}
 *   {...register("headcount", { valueAsNumber: true })}
 * />
 *
 * // For decimal numbers (like duration)
 * <NumberField
 *   label="預估時數"
 *   required
 *   step="0.1"
 *   inputMode="decimal"
 *   error={errors.duration?.message}
 *   {...register("duration", { valueAsNumber: true })}
 * />
 * ```
 */

import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { FormField } from "./FormField";

export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /**
   * Field label text
   */
  label: string;

  /**
   * Whether the field is required (shows red asterisk)
   */
  required?: boolean;

  /**
   * Error message to display (from form validation)
   */
  error?: string;

  /**
   * Additional description or help text
   */
  description?: string;

  /**
   * Custom class name for the input
   */
  inputClassName?: string;
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  (
    {
      label,
      required = false,
      error,
      description,
      inputClassName = "tiani-input",
      className,
      inputMode = "numeric",
      ...inputProps
    },
    ref,
  ) => {
    return (
      <FormField
        label={label}
        required={required}
        error={error}
        description={description}
        className={className}
      >
        <input
          type="number"
          inputMode={inputMode}
          className={inputClassName}
          ref={ref}
          {...inputProps}
        />
      </FormField>
    );
  },
);

NumberField.displayName = "NumberField";
