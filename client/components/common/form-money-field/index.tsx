"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MoneyInput } from "@/components/common/money-input";
import type { FormMoneyFieldProps } from "./form-money-field.types";

export type { FormMoneyFieldProps } from "./form-money-field.types";

export const FormMoneyField = ({
  name,
  label,
  description,
  placeholder,
  disabled,
  className,
  inputClassName,
}: FormMoneyFieldProps) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label ? <FormLabel>{label}</FormLabel> : null}
          <FormControl>
            <MoneyInput
              value={(field.value ?? null) as number | null}
              onChange={(value) => field.onChange(value)}
              onBlur={field.onBlur}
              placeholder={placeholder}
              disabled={disabled}
              inputClassName={inputClassName}
            />
          </FormControl>
          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
