import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { TransactionType } from "../../common/types/financial-enums";
import { TRANSACTION_TYPE_VALUES } from "./create-transaction.dto";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class QueryTransactionsDto extends PaginationDto {
  @IsOptional()
  @Matches(ISO_DATE, { message: "from debe ser YYYY-MM-DD" })
  @IsDateString({}, { message: "from debe ser una fecha válida" })
  from?: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: "to debe ser YYYY-MM-DD" })
  @IsDateString({}, { message: "to debe ser una fecha válida" })
  to?: string;

  @IsOptional()
  @IsIn(TRANSACTION_TYPE_VALUES)
  type?: TransactionType;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
