import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from "class-validator";

export const MONTH_OR_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

export class CreateBudgetDto {
  @IsUUID()
  categoryId: string;

  @Matches(MONTH_OR_DATE, { message: "period debe ser YYYY-MM o YYYY-MM-DD" })
  period: string;

  @IsNumber()
  @Min(0)
  limit: number;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;
}
