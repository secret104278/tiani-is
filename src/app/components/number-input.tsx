"use client";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function NumberInput({
  value,
  onChange,
  min = 1,
  max,
  size = "sm",
  label,
}: NumberInputProps) {
  const handleChange = (newValue: number) => {
    if (newValue < min) return;
    if (max !== undefined && newValue > max) return;
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="font-medium text-sm">{label}</span>}
      <div className="join">
        <button
          className={`btn join-item btn-${size}`}
          onClick={() => handleChange(value - 1)}
          disabled={value <= min}
        >
          -
        </button>
        <input
          type="number"
          className="join-item w-16 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={value}
          onChange={(e) => handleChange(Number.parseInt(e.target.value))}
          min={min}
          max={max}
        />
        <button
          className={`btn join-item btn-${size}`}
          onClick={() => handleChange(value + 1)}
          disabled={max !== undefined && value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}
