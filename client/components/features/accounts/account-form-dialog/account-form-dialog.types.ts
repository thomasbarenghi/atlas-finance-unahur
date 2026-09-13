import type { Account, AccountType } from "@/lib/api/types";

export interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  initialType?: AccountType;
}
