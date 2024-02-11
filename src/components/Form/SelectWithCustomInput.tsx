import type { ReactNode } from "react";

export function NestedSelect({
  topics,
}: {
  topics: { topic: string; options: string[] }[];
}) {
  return topics.map((topic, i) => (
    <optgroup key={i} label={topic.topic}>
      {topic.options.map((option, j) => (
        <option key={j}>{option}</option>
      ))}
    </optgroup>
  ));
}

export default function SelectWithCustomInput({
  selectProps,
  customInputProps,
  showCustomInput,
  children,
}: {
  selectProps: React.SelectHTMLAttributes<HTMLSelectElement>;
  customInputProps: React.InputHTMLAttributes<HTMLInputElement>;
  showCustomInput?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <select
        className="select select-bordered w-full"
        required
        {...selectProps}
      >
        {children}
        <optgroup label="其他">
          <option>自行輸入</option>
        </optgroup>
      </select>
      <label className="label">
        <span className="label-text"></span>
      </label>
      <input
        type="text"
        hidden={!showCustomInput}
        className="tiani-input"
        {...customInputProps}
      />
    </>
  );
}
