/**
 * DateTimeField - Date/time input with FormField wrapper
 *
 * Combines FormField with a datetime-local input for consistent styling
 * and validation error display.
 *
 * Usage:
 * ```tsx
 * <DateTimeField
 *   label="開始時間"
 *   required
 *   error={errors.startDateTime?.message}
 *   {...register("startDateTime", { valueAsDate: true })}
 * />
 * ```
 */

import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { FormField } from "./FormField";

export interface DateTimeFieldProps
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

export const DateTimeField = forwardRef<HTMLInputElement, DateTimeFieldProps>(
  (
    {
      label,
      required = false,
      error,
      description,
      inputClassName = "tiani-input",
      className,
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
          type="datetime-local"
          className={inputClassName}
          ref={ref}
          {...inputProps}
        />
      </FormField>
    );
  },
);

DateTimeField.displayName = "DateTimeField";
