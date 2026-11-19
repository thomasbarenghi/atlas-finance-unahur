import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from "class-validator";
import { CategoryType } from "../../common/types/financial-enums";

export const CATEGORY_TYPE_VALUES: CategoryType[] = ["income", "expense"];
export const CATEGORY_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export class CreateCategoryDto {
  @IsString()
  @Length(1, 40)
  name: string;

  @IsIn(CATEGORY_TYPE_VALUES)
  type: CategoryType;

  @Matches(CATEGORY_COLOR_PATTERN, {
    message: "color debe ser un hex #RRGGBB",
  })
  color: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string | null;
}
