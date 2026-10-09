import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "@/lib/native/platform";
import type { AuthResponse } from "./types";

const REFRESH_TOKEN_KEY = "atlassfin.native.refreshToken";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let loadPromise: Promise<void> | null = null;

export const ensureTokensLoaded = (): Promise<void> => {
  if (!isNativePlatform()) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = Preferences.get({ key: REFRESH_TOKEN_KEY })
      .then(({ value }) => {
        refreshToken = value;
      })
      .catch(() => {
        refreshToken = null;
      });
  }
  return loadPromise;
};

export const getAccessToken = (): string | null => accessToken;

export const getRefreshToken = (): string | null => refreshToken;

export const setTokens = (tokens: AuthResponse | TokenPair): void => {
  if (!isNativePlatform()) return;
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  void Preferences.set({ key: REFRESH_TOKEN_KEY, value: tokens.refreshToken });
};

export const clearTokens = (): void => {
  if (!isNativePlatform()) return;
  accessToken = null;
  refreshToken = null;
  void Preferences.remove({ key: REFRESH_TOKEN_KEY });
};
