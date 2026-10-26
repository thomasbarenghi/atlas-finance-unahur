"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Account, Category, TransactionType } from "@/lib/api/types";
import type { TransactionFormValues } from "@/lib/validation/transactions";
import { FIELD_LABEL, FIELD_SELECT } from "@/components/common/ui-classes";
import { cn } from "@/lib/utils";

const labelClass = cn(FIELD_LABEL, "max-sm:text-[10px]");

export interface TransactionAccountFieldsProps {
  form: UseFormReturn<TransactionFormValues>;
  type: TransactionType;
  accounts: Account[];
  destinationAccounts: Account[];
  categoryOptions: Category[];
}

const triggerClass = cn(FIELD_SELECT, "w-full");

export const TransactionAccountFields = ({
  form,
  type,
  accounts,
  destinationAccounts,
  categoryOptions,
}: TransactionAccountFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="accountId"
        render={({ field }) => (
          <FormItem className="gap-1.5">
            <FormLabel className={labelClass}>Cuenta</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className={triggerClass}>
                  <SelectValue
                    placeholder={
                      type === "transfer" ? "Cuenta origen" : "Cuenta"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {type === "transfer" ? (
        <FormField
          control={form.control}
          name="transferAccountId"
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <FormLabel className={labelClass}>Cuenta destino</FormLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className={triggerClass}>
                    <SelectValue placeholder="Cuenta destino" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {destinationAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {destinationAccounts.length === 0 ? (
                <p className="text-muted-foreground text-[11px]">
                  Necesitás otra cuenta para transferir.
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <FormLabel className={labelClass}>Categoría</FormLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className={triggerClass}>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};
