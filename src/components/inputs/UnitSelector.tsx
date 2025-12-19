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
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");
  const [l3, setL3] = useState("");
  const [l4, setL4] = useState("");

  const [customFull, setCustomFull] = useState("");
  const [customL2, setCustomL2] = useState("");
  const [customL3, setCustomL3] = useState("");

  const lastEmittedValue = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentValue = value ?? "";

    if (currentValue === lastEmittedValue.current) {
      return;
    }

    const remaining = currentValue;
    let newL1 = "";
    let newL2 = "";
    let newL3 = "";
    let newL4 = "";
    let newCustomFull = "";
    let newCustomL2 = "";
    let newCustomL3 = "";

    if (remaining) {
      const foundL1 = LEVEL_1_OPTIONS.find((opt) => remaining.startsWith(opt));

      if (foundL1) {
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
              newL1 = foundL1;
              newL2 = foundL2;
              newL3 = foundL3;
              newL4 = foundL4;
              if (tempRemaining.substring(foundL4.length).length > 0) {
                newL1 = "Other";
                newCustomFull = currentValue;
                newL2 = "";
                newL3 = "";
                newL4 = "";
              }
            } else {
              newL1 = "Other";
              newCustomFull = currentValue;
            }
          } else if (tempRemaining.length > 0) {
            newL1 = foundL1;
            newL2 = foundL2;
            newL3 = "Other";
            newCustomL3 = tempRemaining;
          } else {
            newL1 = foundL1;
            newL2 = foundL2;
          }
        } else if (tempRemaining.length > 0) {
          newL1 = foundL1;
          newL2 = "Other";
          newCustomL2 = tempRemaining;
        } else {
          newL1 = foundL1;
        }
      } else {
        newL1 = "Other";
        newCustomFull = currentValue;
      }
    }

    setL1(newL1);
    setL2(newL2);
    setL3(newL3);
    setL4(newL4);
    setCustomFull(newCustomFull);
    setCustomL2(newCustomL2);
    setCustomL3(newCustomL3);
  }, [value]);

  const buildValue = (
    ucL1: string,
    ucL2: string,
    ucL3: string,
    ucL4: string,
    ucCustomFull: string,
    ucCustomL2: string,
    ucCustomL3: string,
  ) => {
    if (ucL1 === "Other") {
      return ucCustomFull;
    }

    const part1 = ucL1;
    const part2 = ucL2 === "Other" ? ucCustomL2 : ucL2;
    const part3 = ucL3 === "Other" ? ucCustomL3 : ucL3;
    const part4 = ucL4;

    return `${part1}${part2}${part3}${part4}`;
  };

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

    const newValue = buildValue(
      ucL1,
      ucL2,
      ucL3,
      ucL4,
      customFull,
      customL2,
      customL3,
    );

    lastEmittedValue.current = newValue;
    onChange(newValue);
  };

  const handleCustomUpdate = (val: string) => {
    setCustomFull(val);
    const newValue = buildValue(l1, l2, l3, l4, val, customL2, customL3);
    lastEmittedValue.current = newValue;
    onChange(newValue);
  };

  const handleCustomL2Update = (val: string) => {
    setCustomL2(val);
    const newValue = buildValue(l1, l2, l3, l4, customFull, val, customL3);
    lastEmittedValue.current = newValue;
    onChange(newValue);
  };

  const handleCustomL3Update = (val: string) => {
    setCustomL3(val);
    const newValue = buildValue(l1, l2, l3, l4, customFull, customL2, val);
    lastEmittedValue.current = newValue;
    onChange(newValue);
  };

  const handleL1Change = (val: string) => {
    setL1(val);
    if (val === "Other") {
      setCustomFull("");
    }
    const newValue = buildValue(val, l2, l3, l4, "", customL2, customL3);
    lastEmittedValue.current = newValue;
    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-2">
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
        <div className="flex flex-col space-y-1">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="輸入完整單位名稱"
            value={customFull}
            disabled={disabled}
            onChange={(e) => handleCustomUpdate(e.target.value)}
          />
        </div>
      )}

      {l1 !== "" && (
        <>
          <div className="flex flex-col space-y-1">
            <select
              className="select select-bordered w-full"
              value={l2}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                setL2(val);
                if (val === "Other") {
                  setCustomL2("");
                }
                const newValue = buildValue(
                  l1,
                  val,
                  l3,
                  l4,
                  customFull,
                  "",
                  customL3,
                );
                lastEmittedValue.current = newValue;
                onChange(newValue);
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
              <option value="Other">其他</option>
            </select>
          </div>

          {l2 === "Other" && (
            <div className="flex flex-col space-y-1">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="輸入次級單位名稱"
                value={customL2}
                disabled={disabled}
                onChange={(e) => handleCustomL2Update(e.target.value)}
              />
            </div>
          )}
        </>
      )}

      {l1 !== "" && l2 !== "" && (
        <>
          <div className="flex flex-col space-y-1">
            <select
              className="select select-bordered w-full"
              value={l3}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                setL3(val);
                if (val === "Other") {
                  setCustomL3("");
                }
                const newValue = buildValue(
                  l1,
                  l2,
                  val,
                  l4,
                  customFull,
                  customL2,
                  "",
                );
                lastEmittedValue.current = newValue;
                onChange(newValue);
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
              <option value="Other">其他</option>
            </select>
          </div>

          {l3 === "Other" && (
            <div className="flex flex-col space-y-1">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="輸入下級單位名稱"
                value={customL3}
                disabled={disabled}
                onChange={(e) => handleCustomL3Update(e.target.value)}
              />
            </div>
          )}
        </>
      )}

      {l1 !== "" && l2 !== "" && l3 !== "" && (
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
