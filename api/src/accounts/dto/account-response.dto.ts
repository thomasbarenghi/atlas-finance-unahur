import { AccountType } from "../../common/types/financial-enums";

export interface AccountResponseDto {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  archived: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
