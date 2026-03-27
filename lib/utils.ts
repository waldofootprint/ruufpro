// Utility for merging Tailwind CSS classes.
// Standard in shadcn projects — combines class names and resolves conflicts.

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
