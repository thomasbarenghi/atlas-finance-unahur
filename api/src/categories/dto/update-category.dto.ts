import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from "class-validator";
import { CategoryType } from "../../common/types/financial-enums";
import { CATEGORY_TYPE_VALUES } from "./create-category.dto";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  name?: string;

  @IsOptional()
  @IsIn(CATEGORY_TYPE_VALUES)
  type?: CategoryType;

  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR, { message: "color debe ser un hex válido" })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  icon?: string | null;
}
