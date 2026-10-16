import { AccountType } from "../../common/types/financial-enums";

export class AccountResponseDto {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
