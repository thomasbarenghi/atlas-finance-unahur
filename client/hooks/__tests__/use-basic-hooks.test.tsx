import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "@/hooks/use-debounce";
import { useMounted } from "@/hooks/use-mounted";
import { useQueryParam } from "@/hooks/use-query-param";
import { useMediaQuery } from "@/hooks/use-media-query";

describe("useDebounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("emits the initial value immediately and debounces updates", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "a" } },
    );

    expect(result.current).toBe("a");

    rerender({ value: "b" });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("b");
  });

  it("cancels a pending update when the value changes again", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender({ value: "c" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe("c");
  });
});

describe("useMounted", () => {
  it("reports mounted on the client", () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(true);
  });
});

describe("useQueryParam", () => {
  const setSearch = (search: string) => {
    window.history.replaceState({}, "", search);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  it("reads a query parameter from the URL", () => {
    window.history.replaceState({}, "", "/?id=abc&period=2026-01");
    const { result } = renderHook(() => useQueryParam("id"));
    expect(result.current).toBe("abc");
  });

  it("returns null when the parameter is absent", () => {
    window.history.replaceState({}, "", "/");
    const { result } = renderHook(() => useQueryParam("id"));
    expect(result.current).toBeNull();
  });

  it("updates when the URL changes", async () => {
    window.history.replaceState({}, "", "/?id=abc");
    const { result } = renderHook(() => useQueryParam("id"));
    expect(result.current).toBe("abc");

    act(() => setSearch("/?id=xyz"));
    await waitFor(() => expect(result.current).toBe("xyz"));
  });
});

describe("useMediaQuery", () => {
  it("reflects the current match and reacts to changes", async () => {
    const listeners = new Set<() => void>();
    let matches = false;
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: (_event: string, listener: () => void) =>
          listeners.add(listener),
        removeEventListener: (_event: string, listener: () => void) =>
          listeners.delete(listener),
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })),
    );

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    matches = true;
    act(() => {
      listeners.forEach((listener) => listener());
    });
    await waitFor(() => expect(result.current).toBe(true));
  });
});
