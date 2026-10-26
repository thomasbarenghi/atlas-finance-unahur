"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FIELD_LABEL } from "@/components/common/ui-classes";
import { MoneyFieldInput } from "./components/money-field-input";

export interface FormMoneyFieldProps {
  name: string;
  label?: string;
  currency?: string;
}

export const FormMoneyField = ({
  name,
  label,
  currency,
}: FormMoneyFieldProps) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label ? (
            <FormLabel className={FIELD_LABEL}>{label}</FormLabel>
          ) : null}
          <FormControl>
            <MoneyFieldInput
              value={(field.value ?? null) as number | null}
              onChange={(value) => field.onChange(value)}
              onBlur={field.onBlur}
              currency={currency}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
