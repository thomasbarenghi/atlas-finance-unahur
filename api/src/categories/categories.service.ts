import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import {
  CategoryResponseDto,
  toCategoryResponse,
} from "./dto/category-response.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { Category } from "./entities/category.entity";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async listCategories(userId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesRepository.find({
      where: [{ userId }, { userId: IsNull() }],
      order: { type: "ASC", name: "ASC" },
    });
    return categories.map(toCategoryResponse);
  }

  async createCategory(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = this.categoriesRepository.create({
      userId,
      name: dto.name.trim(),
      type: dto.type,
      color: dto.color,
      icon: dto.icon?.trim() || null,
    });
    return toCategoryResponse(await this.categoriesRepository.save(category));
  }

  async updateCategory(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.findOwnedCategory(userId, id);

    if (dto.name !== undefined) category.name = dto.name.trim();
    if (dto.type !== undefined) category.type = dto.type;
    if (dto.color !== undefined) category.color = dto.color;
    if (dto.icon !== undefined) category.icon = dto.icon?.trim() || null;

    return toCategoryResponse(await this.categoriesRepository.save(category));
  }

  async archiveCategory(
    userId: string,
    id: string,
  ): Promise<CategoryResponseDto> {
    const category = await this.findOwnedCategory(userId, id);
    category.archived = true;
    return toCategoryResponse(await this.categoriesRepository.save(category));
  }

  async findOwnedCategory(userId: string, id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOneBy({ id });
    const owned = category?.userId === userId;
    if (!category || (!owned && category.userId !== null)) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La categoría no existe",
      );
    }
    if (category.userId === null) {
      throw new ApiException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        "Las categorías del sistema no se editan",
      );
    }
    return category;
  }

  async assertCategoryUsable(
    userId: string,
    id: string,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findOneBy({ id });
    if (!category || (category.userId !== userId && category.userId !== null)) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La categoría no existe",
      );
    }
    return toCategoryResponse(category);
  }
}
