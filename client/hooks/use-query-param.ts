"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Reads a query parameter from the current URL. Uses Next's reactive
 * `useSearchParams` so client-side navigations (which use `pushState`, not
 * `popstate`) re-render the consumer on the first click.
 */
export const useQueryParam = (key: string): string | null => {
  const searchParams = useSearchParams();

  return useMemo(() => searchParams.get(key), [searchParams, key]);
};
