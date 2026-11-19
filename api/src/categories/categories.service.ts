import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { CategoryType } from "../common/types/financial-enums";
import { CreateCategoryDto } from "./dto/create-category.dto";
import {
  CategoryResponseDto,
  toCategoryResponse,
} from "./dto/category-response.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { Category } from "./entities/category.entity";

/**
 * Category catalog: the system categories (`user_id` null) are read-only for
 * everyone; each user can create, edit and delete their own on top of them.
 */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async listCategories(userId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesRepository.find({
      where: [{ userId: IsNull() }, { userId }],
      order: { type: "ASC", name: "ASC" },
    });
    return categories.map(toCategoryResponse);
  }

  async createCategory(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const name = this.normalizeName(dto.name);
    await this.assertNameAvailable(userId, name, dto.type);

    const category = this.categoriesRepository.create({
      userId,
      name,
      type: dto.type,
      color: dto.color.toLowerCase(),
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

    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);
      await this.assertNameAvailable(userId, name, category.type, category.id);
      category.name = name;
    }
    if (dto.color !== undefined) category.color = dto.color.toLowerCase();
    if (dto.icon !== undefined) category.icon = dto.icon?.trim() || null;

    return toCategoryResponse(await this.categoriesRepository.save(category));
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const category = await this.findOwnedCategory(userId, id);
    // The FK is `ON DELETE SET NULL`: transactions that used it stay valid and
    // are shown as "Sin categoría".
    await this.categoriesRepository.delete({ id: category.id, userId });
  }

  /** A movement may only reference a system category or one of its own. */
  async assertCategoryAssignable(
    userId: string,
    id: string,
    type: CategoryType,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findOne({
      where: [
        { id, userId: IsNull() },
        { id, userId },
      ],
    });
    if (!category) throw this.notFound();
    if (category.type !== type) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "La categoría no corresponde al tipo de movimiento",
        {
          categoryId: ["Elegí una categoría del mismo tipo que el movimiento"],
        },
      );
    }
    return toCategoryResponse(category);
  }

  private async findOwnedCategory(
    userId: string,
    id: string,
  ): Promise<Category> {
    const category = await this.categoriesRepository.findOneBy({ id, userId });
    if (!category) throw this.notFound();
    return category;
  }

  private async assertNameAvailable(
    userId: string,
    name: string,
    type: CategoryType,
    excludeId?: string,
  ): Promise<void> {
    const categories = await this.categoriesRepository.find({
      where: [
        { userId: IsNull(), type },
        { userId, type },
      ],
    });
    const duplicate = categories.find(
      (category) =>
        category.id !== excludeId &&
        category.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "Ya existe una categoría con ese nombre",
        { name: ["Ya existe una categoría con ese nombre"] },
      );
    }
  }

  private normalizeName(value: string): string {
    const name = value.trim();
    if (!name) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "Ingresá un nombre",
        { name: ["Ingresá un nombre"] },
      );
    }
    return name;
  }

  private notFound(): ApiException {
    return new ApiException(
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      "La categoría no existe",
    );
  }
}
