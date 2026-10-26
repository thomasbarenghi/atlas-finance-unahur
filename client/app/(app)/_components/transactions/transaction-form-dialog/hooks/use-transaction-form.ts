"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/errors";
import type {
  Account,
  Category,
  Transaction,
  TransactionType,
} from "@/lib/api/types";
import { sortCategories } from "@/lib/categories";
import { todayIso } from "@/lib/format";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/lib/query/transactions";
import {
  transactionSchema,
  type TransactionFormValues,
} from "@/lib/validation/transactions";
import { useAmountInput } from "./use-amount-input";

export interface UseTransactionFormOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  initialType?: TransactionType;
  initialAccountId?: string;
}

export const useTransactionForm = ({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  initialType,
  initialAccountId,
}: UseTransactionFormOptions) => {
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const isEditing = Boolean(transaction);
  const isPending = createTransaction.isPending || updateTransaction.isPending;

  const firstAccountId = initialAccountId ?? accounts[0]?.id ?? "";
  const defaultType = transaction?.type ?? initialType ?? "expense";
  const initialAmount = transaction ? Math.abs(transaction.amount) : 0;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      amount: initialAmount,
      date: transaction?.date ?? todayIso(),
      accountId: transaction?.accountId ?? firstAccountId,
      transferAccountId: transaction?.transferAccountId ?? undefined,
      categoryId: transaction?.categoryId ?? undefined,
      description: transaction?.description ?? "",
      notes: transaction?.notes ?? "",
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const accountId = useWatch({ control: form.control, name: "accountId" });

  const selectedAccount = accounts.find((account) => account.id === accountId);
  const destinationAccounts = accounts.filter(
    (account) => account.id !== accountId,
  );
  const categoryOptions = sortCategories(
    categories.filter((category) => category.type === type),
  );

  const amountInput = useAmountInput(initialAmount, (amount) =>
    form.setValue("amount", amount, { shouldValidate: false }),
  );

  useEffect(() => {
    if (!open) return;
    if (form.getValues("accountId")) return;
    const fallback = initialAccountId ?? accounts[0]?.id;
    if (fallback) form.setValue("accountId", fallback);
  }, [open, accounts, initialAccountId, form]);

  useEffect(() => {
    const destinationId = form.getValues("transferAccountId");
    if (destinationId && destinationId === accountId) {
      form.setValue("transferAccountId", undefined, { shouldValidate: true });
    }
  }, [accountId, form]);

  const selectType = (next: TransactionType) => {
    form.setValue("type", next);
    if (next === "transfer") {
      form.setValue("categoryId", undefined);
      return;
    }
    const currentCategory = categories.find(
      (category) => category.id === form.getValues("categoryId"),
    );
    if (currentCategory && currentCategory.type !== next) {
      form.setValue("categoryId", undefined);
    }
  };

  const onSubmit = async (values: TransactionFormValues) => {
    const payload = {
      type: values.type,
      amount: values.amount,
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

  return {
    form,
    type,
    selectedAccount,
    destinationAccounts,
    categoryOptions,
    amountInput,
    isEditing,
    isPending,
    selectType,
    onSubmit,
  };
};
