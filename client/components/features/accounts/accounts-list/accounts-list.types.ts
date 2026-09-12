import type { Account } from "@/lib/api/types";

export interface AccountsListProps {
  accounts: Account[];
  sourceNameById?: Map<string, string>;
  isLoading?: boolean;
}
