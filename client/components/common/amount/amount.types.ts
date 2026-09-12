import type { TransactionType } from "@/lib/api/types";

export interface AmountProps {
  value: number;
  currency: string;
  type?: TransactionType;
  className?: string;
}
