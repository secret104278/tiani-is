import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

export default function ReactiveButton({
  loading = false,
  isSuccess = false,
  isError = false,
  ...props
}: {
  loading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
} & DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  if (loading)
    return (
      <button className="btn btn-disabled">
        <div className="loading loading-sm" />
      </button>
    );

  if (isSuccess)
    return (
      <button className="btn btn-disabled">
        <CheckIcon className="h-4 w-4" />
      </button>
    );

  if (isError)
    return (
      <button className="btn btn-error">
        <ExclamationTriangleIcon className="h-4 w-4" />
        錯誤
      </button>
    );

  return <button {...props}></button>;
}
