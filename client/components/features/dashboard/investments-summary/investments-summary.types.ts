import type { DashboardData } from "@/lib/api/types";

export type InvestmentsSummaryProps = DashboardData["investments"] & {
  currency: string;
};
