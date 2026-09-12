import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from "class-validator";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateGoalDto {
  @IsString()
  @Length(1, 80)
  name: string;

  @IsNumber()
  @Min(0)
  targetAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  savedAmount?: number;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: "targetDate debe ser YYYY-MM-DD" })
  targetDate?: string;

  @IsOptional()
  @IsUUID()
  sourceAccountId?: string;
}
