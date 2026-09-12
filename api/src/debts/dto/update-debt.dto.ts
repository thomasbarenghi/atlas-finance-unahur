import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from "class-validator";
import { DebtType } from "../../common/types/financial-enums";
import { ISO_DATE } from "../../assets/dto/create-asset.dto";
import { DEBT_TYPE_VALUES } from "./create-debt.dto";

export class UpdateDebtDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsIn(DEBT_TYPE_VALUES)
  type?: DebtType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: "date debe ser YYYY-MM-DD" })
  date?: string;

  @IsOptional()
  @IsUUID()
  assetId?: string | null;
}
