import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { TransactionType } from "../../common/types/financial-enums";
import { TRANSACTION_TYPE_VALUES } from "./create-transaction.dto";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateTransactionDto {
  @IsOptional()
  @IsIn(TRANSACTION_TYPE_VALUES)
  type?: TransactionType;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  amount?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: "date debe ser YYYY-MM-DD" })
  @IsDateString({}, { message: "date debe ser una fecha válida" })
  date?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  transferAccountId?: string | null;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}
