import type { Budget } from "@/lib/api/types";

export interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget;
  defaultPeriod: string;
}
