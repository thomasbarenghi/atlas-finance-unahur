import type { AccountType } from "@/lib/api/types";

export interface AccountTypePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: AccountType) => void;
}
