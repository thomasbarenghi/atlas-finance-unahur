import type { Account } from "@/lib/api/types";

export interface AccountsListProps {
  accounts: Account[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}
