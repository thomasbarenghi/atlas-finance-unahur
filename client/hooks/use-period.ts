"use client";

import { createContext, useContext } from "react";
import type { PeriodRange } from "@/lib/api/types";
import type { PeriodPreset } from "@/lib/period";

export interface PeriodContextValue {
  preset: PeriodPreset;
  range: PeriodRange;
  setPreset: (preset: PeriodPreset) => void;
  setCustomRange: (range: PeriodRange) => void;
}

export const PeriodContext = createContext<PeriodContextValue | null>(null);

export const usePeriod = (): PeriodContextValue => {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error("usePeriod debe usarse dentro de PeriodProvider");
  }
  return context;
};
