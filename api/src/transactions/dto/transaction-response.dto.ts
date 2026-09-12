import { TransactionType } from "../../common/types/financial-enums";
import { Transaction } from "../entities/transaction.entity";

export interface TransactionResponseDto {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  description: string;
  notes: string | null;
  accountId: string;
  transferAccountId: string | null;
  categoryId: string | null;
  transferGroupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const toTransactionResponse = (
  transaction: Transaction,
): TransactionResponseDto => ({
  id: transaction.id,
  type: transaction.type,
  amount: transaction.amount,
  currency: transaction.currency,
  date: transaction.date,
  description: transaction.description,
  notes: transaction.notes,
  accountId: transaction.accountId,
  transferAccountId: transaction.transferAccountId,
  categoryId: transaction.categoryId,
  transferGroupId: transaction.transferGroupId,
  createdAt: transaction.createdAt.toISOString(),
  updatedAt: transaction.updatedAt.toISOString(),
});
