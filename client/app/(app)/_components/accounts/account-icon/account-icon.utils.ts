import {
  Banknote,
  CircleDollarSign,
  Landmark,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AccountType } from "@/lib/api/types";

export const ACCOUNT_TYPE_ICONS: Record<AccountType, LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  wallet: Wallet,
  other: CircleDollarSign,
};

/** Fallback for legacy/unknown values (e.g. stale `card` rows from older seeds). */
export const DEFAULT_ACCOUNT_ICON = CircleDollarSign;
