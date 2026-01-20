import { forwardRef, useMemo } from "react";

interface SuggestiveInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "list"> {
  options?: string[];
}

/**
 * A text input component that provides suggestions via HTML5 datalist.
 * Allows both selection from predefined options and free text entry.
 * Fully compatible with react-hook-form via forwardRef.
 */
const SuggestiveInput = forwardRef<HTMLInputElement, SuggestiveInputProps>(
  ({ options = [], ...props }, ref) => {
    // Generate a unique ID for the datalist
    const datalistId = useMemo(() => `datalist-${Math.random()}`, []);

    return (
      <>
        <input ref={ref} list={datalistId} {...props} />
        <datalist id={datalistId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </>
    );
  },
);

SuggestiveInput.displayName = "SuggestiveInput";

export default SuggestiveInput;
