"use client";

import { useEffect, useMemo, useState } from "react";
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
import { rateInPrimary } from "@/lib/currency";
import { formatMoneyInput, parseMoneyInput, todayIso } from "@/lib/format";
import { useCurrencyRates } from "@/lib/query/currencies";
import {
  useCreateTransaction,
  useTransactions,
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

interface RateOverride {
  pairKey: string;
  rate: number;
  input: string;
}

const lastUsedRate = (
  transactions: Transaction[],
  currencyById: Map<string, string>,
  sourceCurrency: string,
  destinationCurrency: string,
): number | null => {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    if (transaction.type !== "transfer" || !transaction.transferGroupId) {
      continue;
    }
    const legs = groups.get(transaction.transferGroupId) ?? [];
    legs.push(transaction);
    groups.set(transaction.transferGroupId, legs);
  }

  let latest: { date: string; rate: number } | null = null;
  for (const legs of groups.values()) {
    const outbound = legs.find((leg) => leg.amount < 0) ?? legs[0];
    const inbound = legs.find((leg) => leg.id !== outbound.id) ?? legs[1];
    if (!outbound || !inbound) continue;
    const from = currencyById.get(outbound.accountId);
    const to = currencyById.get(inbound.accountId);
    if (from !== sourceCurrency || to !== destinationCurrency) continue;
    const rate = Math.abs(outbound.amount) / Math.abs(inbound.amount);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    if (!latest || outbound.date > latest.date) {
      latest = { date: outbound.date, rate };
    }
  }
  return latest?.rate ?? null;
};

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
  const ratesQuery = useCurrencyRates();
  const transactionsQuery = useTransactions(
    { page: 1, pageSize: 100 },
    { enabled: open },
  );
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
  const amountValue = useWatch({ control: form.control, name: "amount" });
  const destinationId = useWatch({
    control: form.control,
    name: "transferAccountId",
  });

  const selectedAccount = accounts.find((account) => account.id === accountId);
  const destinationAccount = accounts.find(
    (account) => account.id === destinationId,
  );
  const destinationAccounts = accounts.filter(
    (account) => account.id !== accountId,
  );
  const categoryOptions = sortCategories(
    categories.filter((category) => category.type === type),
  );

  const isCrossCurrency =
    type === "transfer" &&
    Boolean(
      selectedAccount &&
      destinationAccount &&
      selectedAccount.currency !== destinationAccount.currency,
    );

  const currencyById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.currency])),
    [accounts],
  );
  const pairRate = useMemo(() => {
    if (!selectedAccount || !destinationAccount) return 1;
    const rates = ratesQuery.data?.rates ?? [];
    const primary = ratesQuery.data?.primaryCurrency ?? "ARS";
    const sourceRate = rateInPrimary(selectedAccount.currency, rates, primary);
    const destinationRate = rateInPrimary(
      destinationAccount.currency,
      rates,
      primary,
    );
    return sourceRate > 0 ? destinationRate / sourceRate : 1;
  }, [
    destinationAccount,
    ratesQuery.data?.primaryCurrency,
    ratesQuery.data?.rates,
    selectedAccount,
  ]);
  const previousTransferRate = useMemo(() => {
    if (!selectedAccount || !destinationAccount) return null;
    return lastUsedRate(
      transactionsQuery.data?.items ?? [],
      currencyById,
      selectedAccount.currency,
      destinationAccount.currency,
    );
  }, [
    currencyById,
    destinationAccount,
    selectedAccount,
    transactionsQuery.data?.items,
  ]);

  const sibling = useMemo(() => {
    if (!transaction?.transferGroupId) return null;
    return (
      (transactionsQuery.data?.items ?? []).find(
        (item) =>
          item.transferGroupId === transaction.transferGroupId &&
          item.id !== transaction.id,
      ) ?? null
    );
  }, [transaction, transactionsQuery.data?.items]);
  const siblingRate = useMemo(() => {
    if (!transaction || transaction.type !== "transfer" || !sibling) {
      return null;
    }
    const rate = Math.abs(transaction.amount) / Math.abs(sibling.amount);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  }, [sibling, transaction]);

  const [rateOverride, setRateOverride] = useState<RateOverride | null>(null);
  const pairKey = `${selectedAccount?.currency ?? ""}->${
    destinationAccount?.currency ?? ""
  }`;
  const suggestedRate = siblingRate ?? previousTransferRate ?? pairRate;
  const effectiveRate =
    rateOverride && rateOverride.pairKey === pairKey && rateOverride.rate > 0
      ? rateOverride.rate
      : suggestedRate;
  const rateInput =
    rateOverride && rateOverride.pairKey === pairKey
      ? rateOverride.input
      : formatMoneyInput(suggestedRate);
  const amount = Math.abs(amountValue || 0);
  const destinationAmount = isCrossCurrency
    ? amount / (effectiveRate > 0 ? effectiveRate : 1)
    : amount;

  const changeRate = (value: string) => {
    const parsed = parseMoneyInput(value);
    setRateOverride({ pairKey, rate: parsed ?? 0, input: value });
  };

  const amountInput = useAmountInput(initialAmount, (nextAmount) =>
    form.setValue("amount", nextAmount, { shouldValidate: false }),
  );

  useEffect(() => {
    if (!open) return;
    if (form.getValues("accountId")) return;
    const fallback = initialAccountId ?? accounts[0]?.id;
    if (fallback) form.setValue("accountId", fallback);
  }, [open, accounts, initialAccountId, form]);

  useEffect(() => {
    const currentDestination = form.getValues("transferAccountId");
    if (currentDestination && currentDestination === accountId) {
      form.setValue("transferAccountId", undefined, { shouldValidate: true });
    }
  }, [accountId, form]);

  const selectType = (next: TransactionType) => {
    setRateOverride(null);
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
    const currentAmount = Math.abs(values.amount);
    const transferAmount = isCrossCurrency
      ? currentAmount / (effectiveRate > 0 ? effectiveRate : 1)
      : currentAmount;
    if (
      values.type === "transfer" &&
      isCrossCurrency &&
      (!Number.isFinite(transferAmount) || transferAmount <= 0)
    ) {
      toast.error("Ingresá una cotización válida");
      return;
    }
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
      transferAmount: values.type === "transfer" ? transferAmount : undefined,
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
    destinationAccount,
    destinationAccounts,
    categoryOptions,
    amountInput,
    isEditing,
    isPending,
    isCrossCurrency,
    rateInput,
    destinationAmount,
    changeRate,
    selectType,
    onSubmit,
  };
};
