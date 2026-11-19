import { Transform, type TransformFnParams } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from "class-validator";
import { CURRENCY_CODES } from "../../currencies/currency-catalog";

const normalizeEmail = ({ value }: TransformFnParams): unknown =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsIn(CURRENCY_CODES)
  primaryCurrency?: string;
}
