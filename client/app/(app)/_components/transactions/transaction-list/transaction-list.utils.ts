import type { Transaction } from "@/lib/api/types";

export interface TransferDetails {
  groupId: string;
  fromAccountId: string;
  toAccountId: string;
  fromAmount: number;
  toAmount: number;
}

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

/** Both amounts of every transfer group, keyed by `transferGroupId`. */
export const buildTransferDetails = (
  transactions: Transaction[],
): Map<string, TransferDetails> => {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    if (transaction.type !== "transfer" || !transaction.transferGroupId) {
      continue;
    }
    const legs = groups.get(transaction.transferGroupId) ?? [];
    legs.push(transaction);
    groups.set(transaction.transferGroupId, legs);
  }

  const details = new Map<string, TransferDetails>();
  for (const [groupId, legs] of groups) {
    const outbound = legs.find((leg) => leg.amount < 0) ?? legs[0];
    const inbound = legs.find((leg) => leg.id !== outbound.id) ?? legs[1];
    if (!outbound || !inbound) continue;
    details.set(groupId, {
      groupId,
      fromAccountId: outbound.accountId,
      toAccountId: inbound.accountId,
      fromAmount: Math.abs(outbound.amount),
      toAmount: Math.abs(inbound.amount),
    });
  }
  return details;
};
