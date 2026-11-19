import { IsEmail, IsIn, IsString, Length, Matches } from "class-validator";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from "../../common/validation/password";
import { CURRENCY_CODES } from "../../currencies/currency-catalog";

export class RegisterDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsEmail()
  email: string;

  @IsIn(CURRENCY_CODES, { message: "Elegí una moneda válida" })
  primaryCurrency: string;

  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password: string;
}
