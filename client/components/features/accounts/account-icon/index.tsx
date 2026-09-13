import type { AccountType } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPE_ICONS } from "./account-icon.utils";

export { ACCOUNT_TYPE_ICONS } from "./account-icon.utils";

export interface AccountIconProps {
  type: AccountType;
  className?: string;
}

export const AccountIcon = ({ type, className }: AccountIconProps) => {
  const Icon = ACCOUNT_TYPE_ICONS[type];

  return (
    <span
      className={cn(
        "bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
};
