import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from "class-validator";
import { AccountType } from "../../common/types/financial-enums";
import { ACCOUNT_TYPE_VALUES } from "./create-account.dto";

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsIn(ACCOUNT_TYPE_VALUES)
  type?: AccountType;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsNumber()
  initialBalance?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
