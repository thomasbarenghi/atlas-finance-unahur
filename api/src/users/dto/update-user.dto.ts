import { IsBoolean, IsIn, IsOptional, IsString, Length } from "class-validator";
import { Theme } from "../../common/types/financial-enums";

export const THEME_VALUES: Theme[] = ["light", "dark", "system"];

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  baseCurrency?: string;

  @IsOptional()
  @IsIn(THEME_VALUES)
  theme?: Theme;

  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  assistantDestructiveEnabled?: boolean;
}
