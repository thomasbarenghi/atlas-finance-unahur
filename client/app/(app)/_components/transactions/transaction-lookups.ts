import type { Account, Category } from "@/lib/api/types";

interface TransactionLookups {
  accountNameById: Map<string, string>;
  categoryNameById: Map<string, string>;
}

export const buildTransactionLookups = (
  accounts: Account[],
  categories: Category[],
): TransactionLookups => ({
  accountNameById: new Map(
    accounts.map((account) => [account.id, account.name]),
  ),
  categoryNameById: new Map(
    categories.map((category) => [category.id, category.name]),
  ),
});
