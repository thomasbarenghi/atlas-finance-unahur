import type { Valuation } from "@/lib/api/types";

export interface ValuationHistoryProps {
  valuations: Valuation[];
  currency: string;
}
