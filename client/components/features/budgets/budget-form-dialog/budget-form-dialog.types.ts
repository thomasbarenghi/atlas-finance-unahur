import type { Budget, Category } from "@/lib/api/types";

export interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget;
  categories: Category[];
  defaultPeriod: string;
}
