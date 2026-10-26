"use client";

import { IconBadge } from "@/components/common/icon-badge";
import { ResponsiveDialogContent } from "@/components/common/responsive-dialog";
import { ACCOUNT_TYPE_ICONS } from "@/app/(app)/_components/accounts/account-icon";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AccountType } from "@/lib/api/types";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_VALUES } from "@/lib/labels";

export interface AccountTypePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: AccountType) => void;
}

const DESCRIPTIONS: Record<AccountType, string> = {
  cash: "Dinero en mano",
  bank: "Cuentas de banco",
  wallet: "Billeteras virtuales",
  other: "Otros tipos de cuenta",
};

export const AccountTypePicker = ({
  open,
  onOpenChange,
  onSelect,
}: AccountTypePickerProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
          <DialogDescription>
            Elegí qué querés crear y completá los datos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {ACCOUNT_TYPE_VALUES.map((type) => {
            const Icon = ACCOUNT_TYPE_ICONS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => onSelect(type)}
                className="bg-card hover:bg-muted/40 active:bg-muted/60 flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-colors"
              >
                <IconBadge icon={Icon} shape="xl" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {ACCOUNT_TYPE_LABELS[type]}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {DESCRIPTIONS[type]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </ResponsiveDialogContent>
    </Dialog>
  );
};
