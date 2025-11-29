/**
 * Shared Form Components
 *
 * Reusable form field components with consistent styling,
 * validation error display, and accessibility features.
 *
 * Usage:
 * ```tsx
 * import { FormField, DateTimeField, NumberField, FormError } from "~/components/Form/shared";
 * ```
 */

export { FormField, type FormFieldProps } from "./FormField";
export { DateTimeField, type DateTimeFieldProps } from "./DateTimeField";
export {
  ControlledDateTimeField,
  type ControlledDateTimeFieldProps,
} from "./ControlledDateTimeField";
export { NumberField, type NumberFieldProps } from "./NumberField";
export { FormError, type FormErrorProps } from "./FormError";
