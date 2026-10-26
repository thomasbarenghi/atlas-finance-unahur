import type { Transaction } from "@/lib/api/types";
import { formatMonthTitle } from "@/lib/format";

export interface TransactionGroup {
  key: string;
  label: string;
  items: Transaction[];
}

export const groupTransactionsByMonth = (
  transactions: Transaction[],
): TransactionGroup[] => {
  const groups = new Map<string, TransactionGroup>();

  for (const transaction of transactions) {
    const key = transaction.date.slice(0, 7);
    const group = groups.get(key);
    if (group) {
      group.items.push(transaction);
      continue;
    }
    groups.set(key, {
      key,
      label: formatMonthTitle(transaction.date).toUpperCase(),
      items: [transaction],
    });
  }

  return [...groups.values()];
};
