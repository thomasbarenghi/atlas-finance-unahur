import type { TransactionListQuery } from "@/lib/api/types";

export interface DashboardQuery {
  from: string;
  to: string;
  currency?: string;
}

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  accounts: ["accounts"] as const,
  categories: ["categories"] as const,
  currencies: ["currencies"] as const,
  currencyRates: ["currencies", "rates"] as const,
  transactionsBase: ["transactions"] as const,
  transactions: (query: TransactionListQuery) =>
    ["transactions", query] as const,
  dashboardBase: ["dashboard"] as const,
  dashboard: (params: DashboardQuery) => ["dashboard", params] as const,
};
