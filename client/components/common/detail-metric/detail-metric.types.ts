import type { ReactNode } from "react";

export interface DetailMetricProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}
