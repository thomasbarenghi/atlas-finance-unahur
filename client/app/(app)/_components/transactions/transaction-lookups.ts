import type { Account, Category } from "@/lib/api/types";

interface TransactionLookups {
  accountNameById: Map<string, string>;
  accountCurrencyById: Map<string, string>;
  categoryNameById: Map<string, string>;
}

export const buildTransactionLookups = (
  accounts: Account[],
  categories: Category[],
): TransactionLookups => ({
  accountNameById: new Map(
    accounts.map((account) => [account.id, account.name]),
  ),
  accountCurrencyById: new Map(
    accounts.map((account) => [account.id, account.currency]),
  ),
  categoryNameById: new Map(
    categories.map((category) => [category.id, category.name]),
  ),
});
