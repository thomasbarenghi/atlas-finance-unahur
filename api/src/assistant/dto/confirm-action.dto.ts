import { IsString, Length } from "class-validator";

export class ConfirmActionDto {
  @IsString()
  @Length(1, 256)
  token: string;
}
