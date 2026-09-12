import type { Account, Category, Transaction } from "@/lib/api/types";

export interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
}
