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
import { MoneyFieldInput } from "./components/money-field-input";

export interface FormMoneyFieldProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

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
            <MoneyFieldInput
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
