"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { PeriodContext } from "@/hooks/use-period";
import { resolvePeriod, type PeriodPreset } from "@/lib/period";

export const PeriodProvider = ({ children }: { children: ReactNode }) => {
  const [preset, setPreset] = useState<PeriodPreset>("month");
  const range = useMemo(() => resolvePeriod(preset), [preset]);

  const value = useMemo(() => ({ preset, range, setPreset }), [preset, range]);

  return (
    <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
  );
};
