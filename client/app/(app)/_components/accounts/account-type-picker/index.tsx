"use client";

import { DialogShell } from "@/components/common/dialog-shell";
import { DIALOG_BUTTON, DIALOG_FOOTER } from "@/components/common/ui-classes";
import { ACCOUNT_TYPE_ICONS } from "@/app/(app)/_components/accounts/account-icon";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import type { AccountType } from "@/lib/api/types";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_VALUES } from "@/lib/labels";
import { cn } from "@/lib/utils";

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
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Nueva cuenta"
      description="Elegí qué querés crear y completá los datos."
      contentClassName="sm:max-w-[540px] sm:gap-0"
    >
      <div className="dialog-body grid grid-cols-2 gap-2.5 sm:gap-[10px]">
        {ACCOUNT_TYPE_VALUES.map((type) => {
          const Icon = ACCOUNT_TYPE_ICONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className="interactive-card flex min-h-[105px] flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-colors"
            >
              <span className="bg-accent text-primary flex size-[34px] shrink-0 items-center justify-center rounded-full">
                <Icon className="size-[15px]" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-ink text-[12.5px] leading-[17px] font-semibold">
                  {ACCOUNT_TYPE_LABELS[type]}
                </span>
                <span className="text-muted-foreground text-[10.5px] leading-[14px]">
                  {DESCRIPTIONS[type]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <DialogFooter className={DIALOG_FOOTER}>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className={cn(
            DIALOG_BUTTON,
            "bg-[#F5F6F8] hover:bg-[#F5F6F8] sm:bg-card",
          )}
        >
          Cancelar
        </Button>
      </DialogFooter>
    </DialogShell>
  );
};
