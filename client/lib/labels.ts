import type {
  AccountType,
  AssetType,
  CategoryType,
  DebtType,
  TransactionType,
} from "@/lib/api/types";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Efectivo",
  bank: "Bancaria",
  wallet: "Billetera",
  card: "Tarjeta",
  other: "Otra",
  goal: "Objetivo",
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

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  property: "Propiedad",
  vehicle: "Vehículo",
  cash: "Efectivo",
  investment: "Inversión",
  crypto: "Criptoactivo",
  other: "Otro",
};

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  loan: "Préstamo",
  mortgage: "Hipoteca",
  card: "Tarjeta",
  other: "Otra",
};

export const ACCOUNT_TYPE_VALUES = [
  "cash",
  "bank",
  "wallet",
  "card",
  "other",
  "goal",
] as const satisfies readonly AccountType[];

export const ASSET_TYPE_VALUES = [
  "property",
  "vehicle",
  "cash",
  "investment",
  "crypto",
  "other",
] as const satisfies readonly AssetType[];

export const DEBT_TYPE_VALUES = [
  "loan",
  "mortgage",
  "card",
  "other",
] as const satisfies readonly DebtType[];
