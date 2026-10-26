"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { Transaction } from "@/lib/api/types";
import { buildTransactionLookups } from "@/app/(app)/_components/transactions/transaction-lookups";
import { downloadCsv, transactionsToCsv } from "@/lib/csv";
import { formatCurrency, todayIso } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import { useAccounts } from "@/lib/query/accounts";
import { useCategories } from "@/lib/query/categories";
import { useTransactions } from "@/lib/query/transactions";

export const useExportTransactions = () => {
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const transactionsQuery = useTransactions({ page: 1, pageSize: 100 });

  const { accountNameById, accountCurrencyById, categoryNameById } = useMemo(
    () =>
      buildTransactionLookups(
        accountsQuery.data ?? [],
        categoriesQuery.data ?? [],
      ),
    [accountsQuery.data, categoriesQuery.data],
  );

  const exportTransactions = useCallback(
    (transactions?: Transaction[]) => {
      const source = transactions ?? transactionsQuery.data?.items ?? [];
      if (source.length === 0) {
        toast.error("No hay movimientos para exportar");
        return;
      }

      const rows = source.map((transaction) => {
        const accountName = accountNameById.get(transaction.accountId) ?? "";
        const targetName = transaction.transferAccountId
          ? accountNameById.get(transaction.transferAccountId)
          : undefined;
        const currency =
          accountCurrencyById.get(transaction.accountId) ?? "ARS";
        return {
          date: transaction.date,
          type: TRANSACTION_TYPE_LABELS[transaction.type],
          description: transaction.description,
          category: transaction.categoryId
            ? (categoryNameById.get(transaction.categoryId) ?? "")
            : "Sin categoría",
          account: targetName ? `${accountName} → ${targetName}` : accountName,
          currency,
          amount: formatCurrency(transaction.amount, currency),
          notes: transaction.notes ?? "",
        };
      });

      downloadCsv(`movimientos-${todayIso()}.csv`, transactionsToCsv(rows));
      toast.success("Movimientos exportados");
    },
    [
      accountCurrencyById,
      accountNameById,
      categoryNameById,
      transactionsQuery.data,
    ],
  );

  return {
    exportTransactions,
  };
};
