import type { Transaction } from "@/lib/api/types";
import { formatDate, formatDayMonth } from "@/lib/format";

export interface TransactionSubtitleInput {
  transaction: Transaction;
  accountNameById: Map<string, string>;
  categoryNameById: Map<string, string>;
  contextAccountId?: string;
}

export interface TransactionSubtitle {
  mobile: string;
  desktop: string;
}

export const buildTransactionSubtitle = ({
  transaction,
  accountNameById,
  categoryNameById,
  contextAccountId,
}: TransactionSubtitleInput): TransactionSubtitle => {
  const accountName = accountNameById.get(transaction.accountId) ?? "Cuenta";
  const target = transaction.transferAccountId
    ? accountNameById.get(transaction.transferAccountId)
    : undefined;
  const isAccountContext = Boolean(contextAccountId);

  if (transaction.type === "transfer") {
    const contextLabel = target
      ? `${transaction.amount < 0 ? "a" : "de"} ${target}`
      : "Transferencia";
    return {
      mobile: `${formatDayMonth(transaction.date)} · ${
        isAccountContext
          ? contextLabel
          : `${accountName}${target ? ` → ${target}` : ""}`
      }`,
      desktop: `${formatDate(transaction.date)} · Transferencia · ${
        isAccountContext
          ? contextLabel
          : target
            ? `${accountName} → ${target}`
            : accountName
      }`,
    };
  }

  const categoryName =
    (transaction.categoryId
      ? categoryNameById.get(transaction.categoryId)
      : undefined) ?? "Sin categoría";

  return {
    mobile: `${formatDayMonth(transaction.date)} · ${categoryName}${
      isAccountContext ? "" : ` · ${accountName}`
    }`,
    desktop: `${formatDate(transaction.date)} · ${categoryName}${
      isAccountContext ? "" : ` · ${accountName}`
    }`,
  };
};
