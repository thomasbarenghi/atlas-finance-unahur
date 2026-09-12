import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from "class-validator";

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;
}
