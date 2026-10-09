import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setTheme: vi.fn().mockResolvedValue(undefined),
  registerPlugin: vi.fn(),
  isNativePlatform: vi.fn(() => true),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => mocks.isNativePlatform() },
  registerPlugin: (name: string) => {
    mocks.registerPlugin(name);
    return { setTheme: mocks.setTheme };
  },
}));

import { isNativePlatform as platformIsNative } from "@/lib/native/platform";
import { setSystemBarsTheme } from "@/lib/native/system-bars";

describe("native platform helpers", () => {
  beforeEach(() => {
    mocks.setTheme.mockReset().mockResolvedValue(undefined);
    mocks.isNativePlatform.mockReset().mockReturnValue(true);
  });

  it("delegates the platform check to Capacitor", () => {
    mocks.isNativePlatform.mockReturnValue(true);
    expect(platformIsNative()).toBe(true);
    mocks.isNativePlatform.mockReturnValue(false);
    expect(platformIsNative()).toBe(false);
  });

  it("forwards the theme to the NativeBars plugin", async () => {
    await setSystemBarsTheme(true);
    expect(mocks.setTheme).toHaveBeenCalledWith({ dark: true });
  });
});
