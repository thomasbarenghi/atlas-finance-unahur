import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from "class-validator";
import { ValuationSource } from "../../common/types/financial-enums";
import { ISO_DATE } from "./create-asset.dto";

export const VALUATION_SOURCE_VALUES: ValuationSource[] = ["manual", "market"];

export class CreateValuationDto {
  @IsNumber()
  @Min(0)
  value: number;

  @IsString()
  @Length(3, 3)
  currency: string;

  @Matches(ISO_DATE, { message: "date debe ser YYYY-MM-DD" })
  date: string;

  @IsOptional()
  @IsIn(VALUATION_SOURCE_VALUES)
  source?: ValuationSource;
}
