"use client";

import type { UseFormReturn } from "react-hook-form";
import { DatePicker } from "@/components/common/date-picker";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/common/ui-classes";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { TransactionFormValues } from "@/lib/validation/transactions";
import { cn } from "@/lib/utils";

const labelClass = cn(FIELD_LABEL, "max-sm:text-[10px]");

export interface TransactionDetailFieldsProps {
  form: UseFormReturn<TransactionFormValues>;
}

export const TransactionDetailFields = ({
  form,
}: TransactionDetailFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-[150px_1fr] items-start gap-2 sm:grid-cols-[200px_1fr]">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <FormLabel className={cn(labelClass, "max-sm:hidden")}>
                Fecha
              </FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  className={cn(
                    FIELD_INPUT,
                    "h-10 rounded-full text-[11px] font-semibold sm:h-[42px] sm:text-[12px]",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <FormLabel className={cn(labelClass, "max-sm:hidden")}>
                Comentario
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional"
                  className={cn(
                    FIELD_INPUT,
                    "h-10 rounded-full bg-[#F7F8FA] sm:h-[42px]",
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem className="gap-1.5">
            <FormLabel className={labelClass}>Notas</FormLabel>
            <FormControl>
              <Input
                placeholder="Notas (opcional)"
                className={cn(FIELD_INPUT, "h-10 bg-[#F7F8FA] sm:h-[42px]")}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
