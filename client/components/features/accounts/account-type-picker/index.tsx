"use client";

import { OptionPickerDialog } from "@/components/common/option-picker-dialog";
import { ACCOUNT_TYPE_ICONS } from "@/components/features/accounts/account-icon";
import type { AccountType } from "@/lib/api/types";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_VALUES } from "@/lib/labels";
import type { AccountTypePickerProps } from "./account-type-picker.types";

const DESCRIPTIONS: Record<AccountType, string> = {
  cash: "Dinero en mano",
  bank: "Cuentas de banco",
  wallet: "Billeteras virtuales",
  card: "Tarjetas de crédito",
  other: "Otros tipos de cuenta",
  goal: "Meta de ahorro",
};

export const AccountTypePicker = ({
  open,
  onOpenChange,
  onSelect,
}: AccountTypePickerProps) => {
  return (
    <OptionPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nueva cuenta"
      description="Elegí qué querés crear y completá los datos."
      layout="cards"
      options={ACCOUNT_TYPE_VALUES.map((type) => ({
        value: type,
        label: ACCOUNT_TYPE_LABELS[type],
        description: DESCRIPTIONS[type],
        icon: ACCOUNT_TYPE_ICONS[type],
      }))}
      onSelect={onSelect}
    />
  );
};
