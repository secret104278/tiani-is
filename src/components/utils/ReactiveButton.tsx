import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { isEmpty } from "lodash";
import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

export default function ReactiveButton({
  loading = false,
  isSuccess = false,
  isError = false,
  error = "",
  ...props
}: {
  loading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  error?: string;
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

  if (isError || !isEmpty(error))
    return (
      <button className="btn btn-error">
        <ExclamationTriangleIcon className="h-4 w-4" />
        {isEmpty(error) ? "錯誤" : error}
      </button>
    );

  return <button {...props}></button>;
}
