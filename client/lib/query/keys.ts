import type { TransactionFilters } from "@/lib/api/types";

export interface DashboardQuery {
  from: string;
  to: string;
  currency?: string;
}

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  currencies: ["currencies"] as const,
  accounts: ["accounts"] as const,
  categories: ["categories"] as const,
  transactionsBase: ["transactions"] as const,
  transactions: (filters: TransactionFilters) =>
    ["transactions", filters] as const,
  budgetsBase: ["budgets"] as const,
  budgets: (period?: string) => ["budgets", period ?? "all"] as const,
  assets: ["assets"] as const,
  valuations: (assetId: string) => ["assets", assetId, "valuations"] as const,
  debts: ["debts"] as const,
  positions: ["positions"] as const,
  quotes: ["quotes"] as const,
  dashboardBase: ["dashboard"] as const,
  dashboard: (params: DashboardQuery) => ["dashboard", params] as const,
  conversations: ["assistant", "conversations"] as const,
};
