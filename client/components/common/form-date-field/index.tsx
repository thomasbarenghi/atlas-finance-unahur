"use client";

import { useFormContext } from "react-hook-form";
import { DatePicker } from "@/components/common/date-picker";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export interface FormDateFieldProps {
  name: string;
  label: string;
}

export const FormDateField = ({ name, label }: FormDateFieldProps) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <DatePicker value={field.value} onChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
