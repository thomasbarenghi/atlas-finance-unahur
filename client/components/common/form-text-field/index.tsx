"use client";

import type { ComponentProps } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface FormTextFieldProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: ComponentProps<"input">["type"];
  step?: string | number;
  min?: string | number;
  autoComplete?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export const FormTextField = ({
  name,
  label,
  description,
  multiline,
  rows,
  ...inputProps
}: FormTextFieldProps) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label ? <FormLabel>{label}</FormLabel> : null}
          <FormControl>
            {multiline ? (
              <Textarea
                rows={rows ?? 2}
                {...inputProps}
                {...field}
                value={field.value ?? ""}
              />
            ) : (
              <Input {...inputProps} {...field} value={field.value ?? ""} />
            )}
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
