"use client";

import { useTheme } from "next-themes";
import { useNativeSystemBars } from "@/hooks/use-native-system-bars";

export const NativeSystemBars = () => {
  const { resolvedTheme } = useTheme();
  useNativeSystemBars(resolvedTheme === "dark");
  return null;
};
