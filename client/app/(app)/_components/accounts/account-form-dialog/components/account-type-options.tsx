"use client";

import type { AccountType } from "@/lib/api/types";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_VALUES } from "@/lib/labels";
import { ACCOUNT_TYPE_ICONS } from "@/app/(app)/_components/accounts/account-icon";
import { cn } from "@/lib/utils";

export interface AccountTypeOptionsProps {
  value: AccountType;
  onChange: (value: AccountType) => void;
}

export const AccountTypeOptions = ({
  value,
  onChange,
}: AccountTypeOptionsProps) => {
  const order = [
    value,
    ...ACCOUNT_TYPE_VALUES.filter((type) => type !== value),
  ];

  return (
    <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {order.map((type) => {
        const Icon = ACCOUNT_TYPE_ICONS[type];
        const active = value === type;
        return (
          <button
            type="button"
            key={type}
            onClick={() => onChange(type)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/40",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {ACCOUNT_TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
};
