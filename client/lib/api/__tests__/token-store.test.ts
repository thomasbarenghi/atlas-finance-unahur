import { beforeEach, describe, expect, it, vi } from "vitest";

const preferences = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
};

vi.mock("@capacitor/preferences", () => ({ Preferences: preferences }));
vi.mock("@/lib/native/platform", () => ({ isNativePlatform: () => true }));

const load = async () => {
  vi.resetModules();
  return import("@/lib/api/token-store");
};

describe("token-store (native)", () => {
  beforeEach(() => {
    preferences.get
      .mockReset()
      .mockResolvedValue({ value: "persisted-refresh" });
    preferences.set.mockReset().mockResolvedValue(undefined);
    preferences.remove.mockReset().mockResolvedValue(undefined);
  });

  it("loads the refresh token from native preferences once", async () => {
    const store = await load();
    expect(store.getAccessToken()).toBeNull();

    await store.ensureTokensLoaded();
    await store.ensureTokensLoaded();

    expect(store.getRefreshToken()).toBe("persisted-refresh");
    expect(preferences.get).toHaveBeenCalledTimes(1);
  });

  it("persists and clears tokens", async () => {
    const store = await load();
    store.setTokens({ accessToken: "a", refreshToken: "r" });

    expect(store.getAccessToken()).toBe("a");
    expect(store.getRefreshToken()).toBe("r");
    expect(preferences.set).toHaveBeenCalledWith({
      key: "atlassfin.native.refreshToken",
      value: "r",
    });

    store.clearTokens();
    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBeNull();
    expect(preferences.remove).toHaveBeenCalledWith({
      key: "atlassfin.native.refreshToken",
    });
  });
});
