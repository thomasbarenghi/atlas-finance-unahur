"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { PeriodContext } from "@/hooks/use-period";
import type { PeriodRange } from "@/lib/api/types";
import { resolvePeriod, type PeriodPreset } from "@/lib/period";

export const PeriodProvider = ({ children }: { children: ReactNode }) => {
  const [preset, setPreset] = useState<PeriodPreset>("6m");
  const [customRange, setCustomRange] = useState<PeriodRange>(() =>
    resolvePeriod("3m"),
  );

  const range = useMemo(
    () => (preset === "custom" ? customRange : resolvePeriod(preset)),
    [preset, customRange],
  );

  const value = useMemo(
    () => ({ preset, range, setPreset, setCustomRange }),
    [preset, range],
  );

  return (
    <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
  );
};
