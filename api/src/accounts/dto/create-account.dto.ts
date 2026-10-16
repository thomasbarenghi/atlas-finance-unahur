import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from "class-validator";
import { AccountType } from "../../common/types/financial-enums";

export const ACCOUNT_TYPE_VALUES: AccountType[] = [
  "cash",
  "bank",
  "wallet",
  "other",
];

export class CreateAccountDto {
  @IsString()
  @Length(1, 80)
  name: string;

  @IsIn(ACCOUNT_TYPE_VALUES)
  type: AccountType;

  @IsOptional()
  @IsNumber()
  initialBalance?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
