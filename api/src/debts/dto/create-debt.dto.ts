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

export const DEBT_TYPE_VALUES: DebtType[] = [
  "loan",
  "mortgage",
  "card",
  "other",
];

export class CreateDebtDto {
  @IsString()
  @Length(1, 80)
  name: string;

  @IsIn(DEBT_TYPE_VALUES)
  type: DebtType;

  @IsNumber()
  @Min(0)
  balance: number;

  @IsString()
  @Length(3, 3)
  currency: string;

  @Matches(ISO_DATE, { message: "date debe ser YYYY-MM-DD" })
  date: string;

  @IsOptional()
  @IsUUID()
  assetId?: string | null;
}
