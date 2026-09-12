import { CategoryType } from "../../common/types/financial-enums";
import { Category } from "../entities/category.entity";

export interface CategoryResponseDto {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string | null;
  archived: boolean;
  isSystem: boolean;
}

export const toCategoryResponse = (
  category: Category,
): CategoryResponseDto => ({
  id: category.id,
  name: category.name,
  type: category.type,
  color: category.color,
  icon: category.icon,
  archived: category.archived,
  isSystem: category.userId === null,
});
