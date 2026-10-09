import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => true),
  setSystemBarsTheme: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => mocks.isNativePlatform() },
}));
vi.mock("@/lib/native/system-bars", () => ({
  setSystemBarsTheme: (...args: unknown[]) => mocks.setSystemBarsTheme(...args),
}));

import { useNativeSystemBars } from "@/hooks/use-native-system-bars";

describe("useNativeSystemBars", () => {
  beforeEach(() => {
    mocks.setSystemBarsTheme.mockReset().mockResolvedValue(undefined);
    mocks.isNativePlatform.mockReset().mockReturnValue(true);
  });

  it("applies the system bar theme on native platforms", async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    renderHook(() => useNativeSystemBars(true));
    await waitFor(() =>
      expect(mocks.setSystemBarsTheme).toHaveBeenCalledWith(true),
    );
  });

  it("does nothing on the web", async () => {
    mocks.isNativePlatform.mockReturnValue(false);
    renderHook(() => useNativeSystemBars(true));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.setSystemBarsTheme).not.toHaveBeenCalled();
  });

  it("swallows plugin failures", async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.setSystemBarsTheme.mockRejectedValueOnce(new Error("boom"));
    renderHook(() => useNativeSystemBars(false));
    await waitFor(() =>
      expect(mocks.setSystemBarsTheme).toHaveBeenCalledWith(false),
    );
  });
});
