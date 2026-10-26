import {
  Banknote,
  CircleDollarSign,
  Landmark,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AccountType } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const ACCOUNT_TYPE_ICONS: Record<AccountType, LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  wallet: Wallet,
  other: CircleDollarSign,
};

/** Fallback for legacy/unknown values (e.g. stale `card` rows from older seeds). */
const DEFAULT_ACCOUNT_ICON = CircleDollarSign;

export interface AccountIconProps {
  type: AccountType;
  className?: string;
}

export const AccountIcon = ({ type, className }: AccountIconProps) => {
  const Icon = ACCOUNT_TYPE_ICONS[type] ?? DEFAULT_ACCOUNT_ICON;

  return (
    <span
      className={cn(
        "bg-accent text-primary flex size-[30px] shrink-0 items-center justify-center rounded-full md:size-9",
        className,
      )}
    >
      <Icon className="size-[14px] md:size-[17px]" aria-hidden />
    </span>
  );
};
