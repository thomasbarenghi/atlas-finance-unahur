"use client";

import { FormSelectField } from "@/components/common/form-select-field";
import { useCurrencies } from "@/lib/query/reference";

export interface FormCurrencyFieldProps {
  name?: string;
  label?: string;
  fallback?: string;
  disabled?: boolean;
}

export const FormCurrencyField = ({
  name = "currency",
  label = "Moneda",
  fallback = "ARS",
  disabled,
}: FormCurrencyFieldProps) => {
  const currencies = useCurrencies();
  const supported = currencies.data?.supported ?? [fallback];

  return (
    <FormSelectField
      name={name}
      label={label}
      disabled={disabled}
      options={supported.map((currency) => ({
        value: currency,
        label: currency,
      }))}
    />
  );
};
