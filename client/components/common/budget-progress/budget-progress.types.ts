import type { BudgetStatus } from "@/lib/api/types";

export interface BudgetProgressProps {
  status: BudgetStatus;
  consumedPct: number;
  available: number;
  currency: string;
}
