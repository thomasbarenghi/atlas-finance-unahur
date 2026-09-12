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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormTextFieldProps } from "./form-text-field.types";

export type { FormTextFieldProps } from "./form-text-field.types";

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
              <Textarea rows={rows ?? 2} {...inputProps} {...field} />
            ) : (
              <Input {...inputProps} {...field} />
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
