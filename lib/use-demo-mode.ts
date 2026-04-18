"use client";

import { useSearchParams } from "next/navigation";

export function useDemoMode(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get("demo") === "true";
}
