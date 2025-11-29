/**
 * FormError - Form-level error display component
 *
 * Displays mutation errors or form-level validation errors
 * with consistent styling using AlertWarning.
 *
 * Usage:
 * ```tsx
 * <FormError error={error} />
 * ```
 */

import { isNil } from "lodash";
import { AlertWarning } from "~/components/utils/Alert";

export interface FormErrorProps {
  /**
   * Error object (from mutation) or string message
   */
  error?: { message: string } | string | null;

  /**
   * Custom class name for the wrapper
   */
  className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
  // Don't render if no error
  if (isNil(error)) return null;

  // Extract message from error object or use string directly
  const message = typeof error === "string" ? error : error.message;

  return (
    <div className={className}>
      <AlertWarning>{message}</AlertWarning>
    </div>
  );
}
