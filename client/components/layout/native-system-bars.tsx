"use client";

import { useNativeSystemBars } from "@/hooks/use-native-system-bars";

export const NativeSystemBars = () => {
  useNativeSystemBars(false);
  return null;
};
