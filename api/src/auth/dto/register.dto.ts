import { IsEmail, IsString, Length, Matches } from "class-validator";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export class RegisterDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 72)
  @Matches(PASSWORD_PATTERN, {
    message: "La contraseña debe tener al menos una letra y un número",
  })
  password: string;
}
