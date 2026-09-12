import { DebtType } from "../../common/types/financial-enums";
import { Debt } from "../entities/debt.entity";

export interface DebtResponseDto {
  id: string;
  name: string;
  type: DebtType;
  balance: number;
  currency: string;
  date: string;
  archived: boolean;
  assetId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const toDebtResponse = (debt: Debt): DebtResponseDto => ({
  id: debt.id,
  name: debt.name,
  type: debt.type,
  balance: debt.balance,
  currency: debt.currency,
  date: debt.date,
  archived: debt.archived,
  assetId: debt.assetId,
  createdAt: debt.createdAt.toISOString(),
  updatedAt: debt.updatedAt.toISOString(),
});
