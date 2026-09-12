"use client";

import { useMemo, useSyncExternalStore } from "react";

const subscribe = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
};

const getSnapshot = (): string =>
  typeof window === "undefined" ? "" : window.location.search;

const getServerSnapshot = (): string => "";

export const useQueryParam = (key: string): string | null => {
  const search = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return useMemo(() => new URLSearchParams(search).get(key), [search, key]);
};
