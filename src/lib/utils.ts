import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
