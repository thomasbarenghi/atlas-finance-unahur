import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from "class-validator";
import { CATEGORY_COLOR_PATTERN } from "./create-category.dto";

/** `type` is immutable: transactions already reference the category. */
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(1, 40)
  name?: string;

  @IsOptional()
  @Matches(CATEGORY_COLOR_PATTERN, {
    message: "color debe ser un hex #RRGGBB",
  })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string | null;
}
