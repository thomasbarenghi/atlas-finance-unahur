import { useSyncExternalStore } from "react";
import { vi } from "vitest";

export const replace = vi.fn();
export const push = vi.fn();
export const back = vi.fn();
export const forward = vi.fn();
export const refresh = vi.fn();
export const prefetch = vi.fn();

export const useRouter = () => ({
  replace,
  push,
  back,
  forward,
  refresh,
  prefetch,
});

export let searchParams = new URLSearchParams();
const searchParamsListeners = new Set<() => void>();

export const setSearchParams = (params: URLSearchParams): void => {
  searchParams = params;
  searchParamsListeners.forEach((listener) => listener());
};

const subscribeSearchParams = (listener: () => void): (() => void) => {
  searchParamsListeners.add(listener);
  return () => searchParamsListeners.delete(listener);
};

export const useSearchParams = (): URLSearchParams =>
  useSyncExternalStore(
    subscribeSearchParams,
    () => searchParams,
    () => searchParams,
  );

export let pathname = "/";

export const setPathname = (value: string): void => {
  pathname = value;
};

export const usePathname = (): string => pathname;

export const redirect = vi.fn();

export const notFound = vi.fn();

export const resetNavigationMocks = (): void => {
  replace.mockReset();
  push.mockReset();
  back.mockReset();
  forward.mockReset();
  refresh.mockReset();
  prefetch.mockReset();
  setSearchParams(new URLSearchParams());
  pathname = "/";
};
