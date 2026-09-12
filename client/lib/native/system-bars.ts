import { registerPlugin } from "@capacitor/core";

interface NativeBarsPlugin {
  setTheme(options: { dark: boolean }): Promise<void>;
}

const NativeBars = registerPlugin<NativeBarsPlugin>("NativeBars");

export const setSystemBarsTheme = (dark: boolean): Promise<void> =>
  NativeBars.setTheme({ dark });
