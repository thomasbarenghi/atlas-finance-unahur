import type { DashboardInvestmentPosition } from "@/lib/api/types";

export interface InvestmentsSummaryProps {
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPct: number;
  staleQuotes: number;
  positions: DashboardInvestmentPosition[];
  currency: string;
}
