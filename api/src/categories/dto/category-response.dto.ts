import { CategoryType } from "../../common/types/financial-enums";
import { Category } from "../entities/category.entity";

export class CategoryResponseDto {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string | null;
}

export const toCategoryResponse = (
  category: Category,
): CategoryResponseDto => ({
  id: category.id,
  name: category.name,
  type: category.type,
  color: category.color,
  icon: category.icon,
});
