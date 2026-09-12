import {
  Banknote,
  CreditCard,
  Landmark,
  Target,
  Wallet,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";
import type { AccountType } from "@/lib/api/types";

export const ACCOUNT_TYPE_ICONS: Record<AccountType, LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  wallet: Wallet,
  card: CreditCard,
  other: CircleDollarSign,
  goal: Target,
};
