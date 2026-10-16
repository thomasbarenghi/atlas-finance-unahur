import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import {
  CategoryResponseDto,
  toCategoryResponse,
} from "./dto/category-response.dto";
import { Category } from "./entities/category.entity";

/**
 * The category catalog is fixed and defined by the system (FR-TRX-002): it is
 * read-only for every user, so this service only lists and validates them.
 */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async listCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesRepository.find({
      order: { type: "ASC", name: "ASC" },
    });
    return categories.map(toCategoryResponse);
  }

  async assertCategoryExists(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findOneBy({ id });
    if (!category) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La categoría no existe",
      );
    }
    return toCategoryResponse(category);
  }
}
