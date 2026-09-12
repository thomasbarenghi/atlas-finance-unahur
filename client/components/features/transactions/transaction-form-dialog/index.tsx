"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  AmountKeypad,
  type AmountKeypadKey,
} from "@/components/common/amount-keypad";
import { DatePicker } from "@/components/common/date-picker";
import { FormDialog } from "@/components/common/form-dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import { evaluateAmountExpression } from "@/lib/amount-expression";
import { formatCurrency, todayIso } from "@/lib/format";
import type { TransactionType } from "@/lib/api/types";
import { TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/lib/query/transactions";
import { cn } from "@/lib/utils";
import {
  transactionSchema,
  type TransactionFormValues,
} from "@/lib/validation/transactions";
import type { TransactionFormDialogProps } from "./transaction-form-dialog.types";

const TRANSACTION_TYPES: TransactionType[] = ["expense", "income", "transfer"];
const OPERATOR_KEYS: AmountKeypadKey[] = ["+", "−", "×", "÷"];

const signFor = (type: TransactionType): string => {
  if (type === "expense") return "−";
  if (type === "income") return "+";
  return "";
};

export const TransactionFormDialog = ({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
}: TransactionFormDialogProps) => {
  const { user } = useAuth();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const isEditing = Boolean(transaction);
  const isPending = createTransaction.isPending || updateTransaction.isPending;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type ?? "expense",
      amount: transaction ? Math.abs(transaction.amount) : 0,
      currency: transaction?.currency ?? user?.baseCurrency ?? "ARS",
      date: transaction?.date ?? todayIso(),
      accountId:
        transaction?.accountId ??
        accounts.find((account) => !account.archived)?.id ??
        "",
      transferAccountId: transaction?.transferAccountId ?? undefined,
      categoryId: transaction?.categoryId ?? undefined,
      description: transaction?.description ?? "",
      notes: transaction?.notes ?? "",
    },
  });

  const [expression, setExpression] = useState(() => {
    const initial = transaction ? Math.abs(transaction.amount) : 0;
    return initial > 0 ? String(initial) : "";
  });

  const type = useWatch({ control: form.control, name: "type" });
  const accountId = useWatch({ control: form.control, name: "accountId" });
  const currency = useWatch({ control: form.control, name: "currency" });

  const activeAccounts = accounts.filter((account) => !account.archived);
  const selectedAccount = activeAccounts.find(
    (account) => account.id === accountId,
  );
  const categoryOptions = categories.filter(
    (category) => category.type === (type === "income" ? "income" : "expense"),
  );
  const evaluated =
    evaluateAmountExpression(expression.replace(/[+−×÷]+$/, "")) ?? 0;
  const hasOperator = /[+−×÷]/.test(expression);

  const updateExpression = (next: string) => {
    setExpression(next);
    form.setValue("amount", evaluateAmountExpression(next) ?? 0, {
      shouldValidate: false,
    });
  };

  const handleKey = (key: AmountKeypadKey) => {
    if (key === "backspace") {
      updateExpression(expression.slice(0, -1));
      return;
    }
    if (OPERATOR_KEYS.includes(key)) {
      if (!expression) return;
      const next = /[+−×÷]$/.test(expression)
        ? expression.slice(0, -1) + key
        : expression + key;
      updateExpression(next);
      return;
    }
    if (key === ".") {
      const lastNumber = expression.split(/[+−×÷]/).pop() ?? "";
      if (!lastNumber.includes(".")) updateExpression(`${expression}.`);
      return;
    }
    const lastNumber = expression.split(/[+−×÷]/).pop() ?? "";
    const next =
      lastNumber === "0" ? expression.slice(0, -1) + key : expression + key;
    updateExpression(next);
  };

  const onSubmit = async (values: TransactionFormValues) => {
    const payload = {
      type: values.type,
      amount: values.amount,
      currency: values.currency,
      date: values.date,
      description: values.description,
      notes: values.notes ?? null,
      accountId: values.accountId,
      categoryId: values.type === "transfer" ? null : values.categoryId,
      transferAccountId:
        values.type === "transfer" ? values.transferAccountId : null,
    };
    try {
      if (transaction) {
        await updateTransaction.mutateAsync({
          id: transaction.id,
          input: payload,
        });
        toast.success("Movimiento actualizado");
      } else {
        await createTransaction.mutateAsync(payload);
        toast.success("Movimiento creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar el movimiento"));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar movimiento" : "Nuevo movimiento"}
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear movimiento"}
      isPending={isPending}
      contentClassName="max-h-[92dvh] overflow-y-auto sm:max-w-md"
    >
      <div className="bg-muted grid grid-cols-3 gap-1 rounded-2xl p-1">
        {TRANSACTION_TYPES.map((option) => {
          const active = type === option;
          return (
            <button
              type="button"
              key={option}
              disabled={isEditing}
              onClick={() => {
                form.setValue("type", option);
                if (option === "transfer") {
                  form.setValue("categoryId", undefined);
                }
              }}
              className={cn(
                "rounded-xl px-2 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                active ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {TRANSACTION_TYPE_LABELS[option]}
            </button>
          );
        })}
      </div>

      <FormField
        control={form.control}
        name="accountId"
        render={({ field }) => (
          <FormItem>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="h-12 w-full rounded-2xl">
                  <SelectValue
                    placeholder={
                      type === "transfer" ? "Cuenta origen" : "Cuenta"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {activeAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} · {account.currency}
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
            <FormItem>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-12 w-full rounded-2xl">
                    <SelectValue placeholder="Cuenta destino" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeAccounts
                    .filter((account) => account.id !== accountId)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} · {account.currency}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-12 w-full rounded-2xl">
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

      <div className="flex flex-col items-center gap-1 py-1">
        {hasOperator ? (
          <span className="text-muted-foreground text-sm tabular-nums">
            {expression}
          </span>
        ) : null}
        <span className="font-heading text-4xl font-semibold tabular-nums">
          {signFor(type)}
          {formatCurrency(evaluated, currency)}
        </span>
        <span className="text-muted-foreground text-xs">
          Disponible{" "}
          {formatCurrency(selectedAccount?.currentBalance ?? 0, currency)}
        </span>
      </div>

      <FormField
        control={form.control}
        name="amount"
        render={() => (
          <FormItem className="items-center">
            <FormMessage className="text-center" />
          </FormItem>
        )}
      />

      <AmountKeypad onKey={handleKey} />

      <div className="grid grid-cols-[auto_1fr] items-start gap-2">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Comentario" className="h-10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormDialog>
  );
};
