import { useEffect, useRef, useState } from "react";

type UnitSelectorProps = {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const LEVEL_1_OPTIONS = ["基礎忠恕"];
const LEVEL_2_OPTIONS = ["瑞周"];
const LEVEL_3_OPTIONS = ["天惠"];
const LEVEL_4_OPTIONS = ["義德", "忠德", "孝德", "仁德", "愛德", "信德"];

export default function UnitSelector({
  value,
  onChange,
  disabled,
}: UnitSelectorProps) {
  // Internal State
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");
  const [l3, setL3] = useState("");
  const [l4, setL4] = useState("");

  const [customFull, setCustomFull] = useState("");

  // Track the last value we emitted to avoid loops when parent updates back
  const lastEmittedValue = useRef<string | undefined>(undefined);

  // Sync from props (upstream changes)
  useEffect(() => {
    const currentValue = value ?? "";

    // If the incoming value matches what we just emitted, do nothing
    if (currentValue === lastEmittedValue.current) {
      return;
    }

    // Parse value
    const remaining = currentValue;
    let newL1 = "";
    let newL2 = "";
    let newL3 = "";
    let newL4 = "";
    let newCustomFull = "";

    if (remaining) {
      // Try to match strict hierarchy
      const foundL1 = LEVEL_1_OPTIONS.find((opt) => remaining.startsWith(opt));

      if (foundL1) {
        // It matches L1 standard. Now check if it matches the strict hierarchy down the line.
        // If it deviates at any point, we might want to treat it as "Other" (Custom)?
        // Or try to parse as much as possible?
        // User said: "If not select Other, must follow menu".
        // This implies existing data that follows menu is Standard.
        // Data that doesn't follow strict menu is Custom.

        // Let's try to verify strict path.
        let tempRemaining = remaining.substring(foundL1.length);

        const foundL2 = LEVEL_2_OPTIONS.find((opt) =>
          tempRemaining.startsWith(opt),
        );
        if (foundL2) {
          tempRemaining = tempRemaining.substring(foundL2.length);
          const foundL3 = LEVEL_3_OPTIONS.find((opt) =>
            tempRemaining.startsWith(opt),
          );
          if (foundL3) {
            tempRemaining = tempRemaining.substring(foundL3.length);
            const foundL4 = LEVEL_4_OPTIONS.find((opt) =>
              tempRemaining.startsWith(opt),
            );
            if (foundL4) {
              // Full match so far!
              newL1 = foundL1;
              newL2 = foundL2;
              newL3 = foundL3;
              newL4 = foundL4;
              // What if there is still remaining text? E.g. "基礎忠恕瑞周天惠義德Extra"
              // That would fall out of strict dropdowns. So it should be custom.
              if (tempRemaining.substring(foundL4.length).length > 0) {
                // Fallback to custom
                newL1 = "Other";
                newCustomFull = currentValue;
                newL2 = "";
                newL3 = "";
                newL4 = "";
              }
            } else {
              // L4 mismatch
              newL1 = "Other";
              newCustomFull = currentValue;
            }
          } else {
            // L3 mismatch
            newL1 = "Other";
            newCustomFull = currentValue;
          }
        } else {
          // L2 mismatch
          newL1 = "Other";
          newCustomFull = currentValue;
        }
      } else {
        // L1 mismatch
        newL1 = "Other";
        newCustomFull = currentValue;
      }
    }

    setL1(newL1);
    setL2(newL2);
    setL3(newL3);
    setL4(newL4);
    setCustomFull(newCustomFull);
  }, [value]);

  const handleStandardUpdate = (
    ucL1: string,
    ucL2: string,
    ucL3: string,
    ucL4: string,
  ) => {
    setL1(ucL1);
    setL2(ucL2);
    setL3(ucL3);
    setL4(ucL4);

    // Construct standard value
    const newValue = `${ucL1}${ucL2}${ucL3}${ucL4}`;

    lastEmittedValue.current = newValue;
    onChange(newValue);
  };

  const handleCustomUpdate = (val: string) => {
    setCustomFull(val);
    lastEmittedValue.current = val;
    onChange(val);
  };

  const handleL1Change = (val: string) => {
    if (val === "Other") {
      setL1("Other");
      // When switching to other, clear standard parts?
      setL2("");
      setL3("");
      setL4("");
      // Initialize custom input? Empty or keep previous value?
      // If we switch to Other, maybe we start empty.
      setCustomFull("");
      lastEmittedValue.current = "";
      onChange("");
    } else {
      // Switching to Standard
      setL1(val);
      setCustomFull(""); // Clear custom
      // Reset children to empty or first option?
      // UX: usually explicit selection is better.
      setL2("");
      setL3("");
      setL4("");

      // Value is now incomplete standard string.
      // Should we emit partial string? "基礎忠恕"
      lastEmittedValue.current = val;
      onChange(val);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {/* Level 1 */}
      <div className="flex flex-col space-y-1">
        <select
          className="select select-bordered w-full"
          value={l1}
          disabled={disabled}
          onChange={(e) => handleL1Change(e.target.value)}
        >
          <option value="" disabled>
            總單位
          </option>
          {LEVEL_1_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value="Other">其他</option>
        </select>
      </div>

      {l1 === "Other" && (
        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="輸入完整單位名稱"
            value={customFull}
            onChange={(e) => handleCustomUpdate(e.target.value)}
          />
        </div>
      )}

      {/* Level 2 - Only show if L1 is NOT Other and L1 has value */}
      {l1 !== "Other" && l1 !== "" && (
        <div className="flex flex-col space-y-1">
          <select
            className="select select-bordered w-full"
            value={l2}
            disabled={disabled}
            onChange={(e) => {
              // Standard strict update
              handleStandardUpdate(l1, e.target.value, "", ""); // Reset L3, L4 on L2 change
            }}
          >
            <option value="" disabled>
              次級單位
            </option>
            {LEVEL_2_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Level 3 */}
      {l1 !== "Other" && l1 !== "" && l2 !== "" && (
        <div className="flex flex-col space-y-1">
          <select
            className="select select-bordered w-full"
            value={l3}
            disabled={disabled}
            onChange={(e) => {
              handleStandardUpdate(l1, l2, e.target.value, ""); // Reset L4 on L3 change
            }}
          >
            <option value="" disabled>
              下級單位
            </option>
            {LEVEL_3_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Level 4 */}
      {l1 !== "Other" && l1 !== "" && l2 !== "" && l3 !== "" && (
        <div className="flex flex-col space-y-1">
          <select
            className="select select-bordered w-full"
            value={l4}
            disabled={disabled}
            onChange={(e) => {
              handleStandardUpdate(l1, l2, l3, e.target.value);
            }}
          >
            <option value="" disabled>
              單位
            </option>
            {LEVEL_4_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
