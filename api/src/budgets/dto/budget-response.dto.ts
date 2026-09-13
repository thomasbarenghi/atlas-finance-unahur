import { BudgetStatus } from "../../common/types/financial-enums";

export interface BudgetCategoryDto {
  id: string;
  name: string;
  color: string;
}

export interface BudgetResponseDto {
  id: string;
  categoryId: string;
  category: BudgetCategoryDto;
  period: string;
  limit: number;
  currency: string;
  recurring: boolean;
  spent: number;
  available: number;
  consumedPct: number;
  status: BudgetStatus;
}
