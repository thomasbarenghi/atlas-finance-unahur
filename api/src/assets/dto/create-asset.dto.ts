import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { AssetType } from "../../common/types/financial-enums";

export const ASSET_TYPE_VALUES: AssetType[] = [
  "property",
  "vehicle",
  "cash",
  "investment",
  "crypto",
  "other",
];

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateAssetDto {
  @IsString()
  @Length(1, 80)
  name: string;

  @IsIn(ASSET_TYPE_VALUES)
  type: AssetType;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsNumber()
  @Min(0)
  initialValue: number;

  @Matches(ISO_DATE, { message: "date debe ser YYYY-MM-DD" })
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
