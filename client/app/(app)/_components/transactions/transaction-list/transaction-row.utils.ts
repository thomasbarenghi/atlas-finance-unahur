import type { Transaction } from "@/lib/api/types";
import { formatCurrency, formatDate, formatDayMonth } from "@/lib/format";
import type { TransferDetails } from "./transaction-list.utils";

export interface TransactionSubtitleInput {
  transaction: Transaction;
  accountNameById: Map<string, string>;
  accountCurrencyById: Map<string, string>;
  categoryNameById: Map<string, string>;
  contextAccountId?: string;
  transferDetails?: TransferDetails;
  showCents?: boolean;
}

export interface TransactionSubtitle {
  mobile: string;
  desktop: string;
}

export const buildTransactionSubtitle = ({
  transaction,
  accountNameById,
  accountCurrencyById,
  categoryNameById,
  contextAccountId,
  transferDetails,
  showCents = true,
}: TransactionSubtitleInput): TransactionSubtitle => {
  const accountName = accountNameById.get(transaction.accountId) ?? "Cuenta";
  const target = transaction.transferAccountId
    ? accountNameById.get(transaction.transferAccountId)
    : undefined;
  const isAccountContext = Boolean(contextAccountId);

  if (transaction.type === "transfer") {
    const targetCurrency = transferDetails
      ? (accountCurrencyById.get(transferDetails.toAccountId) ?? "ARS")
      : "ARS";
    const sourceCurrency = accountCurrencyById.get(transaction.accountId);
    const isCrossCurrency = Boolean(
      transferDetails && sourceCurrency && sourceCurrency !== targetCurrency,
    );
    const destinationLabel =
      isCrossCurrency && transferDetails
        ? formatCurrency(transferDetails.toAmount, targetCurrency, undefined, {
            showCents,
          })
        : target;
    const contextLabel = destinationLabel
      ? `${transaction.amount < 0 ? "a" : "de"} ${destinationLabel}`
      : "Transferencia";
    return {
      mobile: `${formatDayMonth(transaction.date)} · ${
        isAccountContext
          ? contextLabel
          : `${accountName}${destinationLabel ? ` → ${destinationLabel}` : ""}`
      }`,
      desktop: `${formatDate(transaction.date)} · Transferencia · ${
        isAccountContext
          ? contextLabel
          : destinationLabel
            ? `${accountName} → ${destinationLabel}`
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
