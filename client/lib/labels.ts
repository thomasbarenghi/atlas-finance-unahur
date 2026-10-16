import type {
  AccountType,
  CategoryType,
  TransactionType,
} from "@/lib/api/types";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Efectivo",
  bank: "Bancaria",
  wallet: "Billetera",
  other: "Otra",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
};

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  income: "Ingreso",
  expense: "Gasto",
};

export const ACCOUNT_TYPE_VALUES = [
  "cash",
  "bank",
  "wallet",
  "other",
] as const satisfies readonly AccountType[];
