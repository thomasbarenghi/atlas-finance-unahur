import type { Category, Transaction } from "@/lib/api/types";
import type { DataListPagination } from "@/components/common/data-list";

export interface TransactionListProps {
  transactions: Transaction[];
  accountNameById: Map<string, string>;
  categoryById: Map<string, Category>;
  isLoading?: boolean;
  pagination?: DataListPagination;
  onSelect?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}
