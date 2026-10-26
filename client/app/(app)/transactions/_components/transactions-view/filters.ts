import type {
  PeriodRange,
  Transaction,
  TransactionType,
} from "@/lib/api/types";

export type TransactionTypeFilter = "all" | TransactionType;

export interface TransactionFiltersValue {
  search: string;
  type: TransactionTypeFilter;
  accountId: string;
  categoryId: string;
  range: PeriodRange;
  categoryNameById: Map<string, string>;
}

const normalized = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const matchesSearch = (
  transaction: Transaction,
  search: string,
  categoryNameById: Map<string, string>,
): boolean => {
  if (!search) return true;
  const term = normalized(search);
  const amountTerm = search.replace(/[^\d]/g, "");

  const haystack = normalized(
    [
      transaction.description,
      transaction.notes ?? "",
      categoryNameById.get(transaction.categoryId ?? "") ?? "",
    ].join(" "),
  );

  if (haystack.includes(term)) return true;
  if (!amountTerm) return false;
  return String(Math.abs(transaction.amount)).includes(amountTerm);
};

export const filterTransactions = (
  transactions: Transaction[],
  filters: TransactionFiltersValue,
): Transaction[] =>
  transactions.filter((transaction) => {
    if (filters.type !== "all" && transaction.type !== filters.type) {
      return false;
    }
    if (
      filters.accountId &&
      transaction.accountId !== filters.accountId &&
      transaction.transferAccountId !== filters.accountId
    ) {
      return false;
    }
    if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
      return false;
    }
    if (
      transaction.date < filters.range.from ||
      transaction.date > filters.range.to
    ) {
      return false;
    }
    return matchesSearch(transaction, filters.search, filters.categoryNameById);
  });
