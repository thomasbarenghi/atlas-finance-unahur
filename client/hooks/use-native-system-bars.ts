"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { setSystemBarsTheme } from "@/lib/native/system-bars";

export const useNativeSystemBars = (dark: boolean) => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    setSystemBarsTheme(dark).catch(() => {});
  }, [dark]);
};
