import type { Account, Category, TransactionType } from "@/lib/api/types";

export interface TransactionFilterState {
  type: TransactionType | "";
  accountId: string;
  categoryId: string;
  from: string;
  to: string;
}

export interface TransactionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: TransactionFilterState;
  onFilterChange: (patch: Partial<TransactionFilterState>) => void;
  onClear: () => void;
  accounts: Account[];
  categories: Category[];
}
