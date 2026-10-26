import type { Category, Transaction } from "@/lib/api/types";
import type { PeriodRange } from "@/lib/api/types";

export interface CategoryUsage {
  category: Category;
  amount: number;
  count: number;
  pct: number;
}

export interface CategoryUsageResult {
  items: CategoryUsage[];
  total: number;
}

export const buildCategoryUsage = (
  categories: Category[],
  transactions: Transaction[],
  type: Category["type"],
  range: PeriodRange,
): CategoryUsageResult => {
  const byCategory = new Map<string, { amount: number; count: number }>();

  for (const transaction of transactions) {
    if (!transaction.categoryId) continue;
    if (transaction.date < range.from || transaction.date > range.to) continue;
    const bucket = byCategory.get(transaction.categoryId) ?? {
      amount: 0,
      count: 0,
    };
    bucket.amount += Math.abs(transaction.amount);
    bucket.count += 1;
    byCategory.set(transaction.categoryId, bucket);
  }

  const filtered = categories.filter((category) => category.type === type);
  const total = filtered.reduce(
    (sum, category) => sum + (byCategory.get(category.id)?.amount ?? 0),
    0,
  );

  const items = filtered
    .map((category) => {
      const bucket = byCategory.get(category.id) ?? { amount: 0, count: 0 };
      return {
        category,
        amount: bucket.amount,
        count: bucket.count,
        pct: total > 0 ? bucket.amount / total : 0,
      };
    })
    .sort(
      (first, second) =>
        second.amount - first.amount ||
        first.category.name.localeCompare(second.category.name, "es"),
    );

  return { items, total };
};
