import type { Transaction } from "@/lib/api/types";

export const collapseTransfers = (
  transactions: Transaction[],
): Transaction[] => {
  const legsByGroup = new Map<string, Transaction[]>();
  const ordered: Transaction[] = [];

  for (const transaction of transactions) {
    if (transaction.type !== "transfer" || !transaction.transferGroupId) {
      ordered.push(transaction);
      continue;
    }
    const legs = legsByGroup.get(transaction.transferGroupId);
    if (legs) {
      legs.push(transaction);
    } else {
      legsByGroup.set(transaction.transferGroupId, [transaction]);
      ordered.push(transaction);
    }
  }

  return ordered.map((transaction) => {
    if (transaction.type !== "transfer" || !transaction.transferGroupId) {
      return transaction;
    }
    const legs = legsByGroup.get(transaction.transferGroupId) ?? [];
    return legs.find((leg) => leg.amount < 0) ?? transaction;
  });
};
