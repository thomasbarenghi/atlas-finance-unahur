import type { Valuation } from "@/lib/api/types";

export interface ValuationSummaryProps {
  valuations: Valuation[];
  currency: string;
}
