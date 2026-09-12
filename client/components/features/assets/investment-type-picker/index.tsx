"use client";

import { CreditCard, House, TrendingUp } from "lucide-react";
import {
  OptionPickerDialog,
  type OptionPickerOption,
} from "@/components/common/option-picker-dialog";
import type {
  InvestmentCreationType,
  InvestmentTypePickerProps,
} from "./investment-type-picker.types";

export type { InvestmentCreationType } from "./investment-type-picker.types";

const OPTIONS: OptionPickerOption<InvestmentCreationType>[] = [
  {
    value: "asset",
    label: "Activo",
    description: "Propiedades, vehículos, efectivo",
    icon: House,
  },
  {
    value: "position",
    label: "Inversión",
    description: "Cripto, acciones, instrumentos",
    icon: TrendingUp,
  },
  {
    value: "debt",
    label: "Deuda",
    description: "Préstamos, hipotecas, tarjetas",
    icon: CreditCard,
  },
];

export const InvestmentTypePicker = ({
  open,
  onOpenChange,
  onSelect,
}: InvestmentTypePickerProps) => {
  return (
    <OptionPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo"
      description="¿Qué querés agregar a tu patrimonio?"
      options={OPTIONS}
      onSelect={onSelect}
    />
  );
};
