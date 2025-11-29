import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
import { getDateTimeString } from "~/utils/ui";
import { DateTimeField, type DateTimeFieldProps } from "./DateTimeField";

export interface ControlledDateTimeFieldProps<T extends FieldValues>
  extends Omit<DateTimeFieldProps, "name" | "value" | "onChange" | "onBlur"> {
  /**
   * Field name matches the form schema key
   */
  name: Path<T>;

  /**
   * Form control object from useForm()
   */
  control: Control<T>;
}

/**
 * ControlledDateTimeField - Date/time input integrated with React Hook Form Controller
 *
 * Handles the conversion between Date objects (schema/state) and
 * ISO date strings (input value), eliminating the need for manual type casting.
 *
 * Usage:
 * ```tsx
 * <ControlledDateTimeField
 *   control={control}
 *   name="startDateTime"
 *   label="開始時間"
 *   required
 * />
 * ```
 */
export function ControlledDateTimeField<T extends FieldValues>({
  name,
  control,
  ...props
}: ControlledDateTimeFieldProps<T>) {
  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  // Convert Date object to YYYY-MM-DDTHH:mm string for input
  const inputValue =
    value instanceof Date ? getDateTimeString(value) : (value ?? "");

  return (
    <DateTimeField
      {...props}
      ref={ref}
      name={name}
      value={inputValue}
      onBlur={onBlur}
      error={error?.message}
      onChange={(e) => {
        // Convert input string back to Date object for form state
        const dateValue = e.target.value ? new Date(e.target.value) : undefined;
        onChange(dateValue);
      }}
    />
  );
}
