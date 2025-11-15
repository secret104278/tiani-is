/**
 * FormField - Reusable form field wrapper component
 *
 * Provides consistent field structure with label, input, and error display.
 * Automatically shows required indicator (*) when specified.
 *
 * Usage:
 * ```tsx
 * <FormField
 *   label="姓名"
 *   required
 *   error={errors.name?.message}
 * >
 *   <input {...register("name")} />
 * </FormField>
 * ```
 */

import type { ReactNode } from "react";

export interface FormFieldProps {
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
   * Custom class name for the wrapper div
   */
  className?: string;

  /**
   * Input element(s) to render
   */
  children: ReactNode;
}

export function FormField({
  label,
  required = false,
  error,
  description,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="label">
        <span className="label-text">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>
      {children}
      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
      {description && !error && (
        <label className="label">
          <span className="label-text-alt">{description}</span>
        </label>
      )}
    </div>
  );
}
