import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/use-auth";
import { usePeriod } from "@/hooks/use-period";

describe("context hooks", () => {
  it("useAuth throws a descriptive error outside AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
    spy.mockRestore();
  });

  it("usePeriod throws a descriptive error outside PeriodProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => usePeriod())).toThrow(/PeriodProvider/);
    spy.mockRestore();
  });
});
