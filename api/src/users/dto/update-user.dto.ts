import { IsIn, IsOptional, IsString, Length } from "class-validator";
import { CURRENCY_CODES } from "../../currencies/currency-catalog";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsIn(CURRENCY_CODES)
  primaryCurrency?: string;
}
