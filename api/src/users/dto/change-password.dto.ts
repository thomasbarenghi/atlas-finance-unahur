import { IsString, Length, Matches } from "class-validator";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from "../../common/validation/password";

export class ChangePasswordDto {
  @IsString()
  @Length(1, PASSWORD_MAX_LENGTH)
  currentPassword: string;

  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
