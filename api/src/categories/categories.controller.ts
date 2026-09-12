import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CategoriesService } from "./categories.service";
import { CategoryResponseDto } from "./dto/category-response.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "Lista las categorías del usuario y del sistema" })
  @ApiOkResponse({ description: "CategoryResponseDto[]" })
  list(@CurrentUser("id") userId: string): Promise<CategoryResponseDto[]> {
    return this.categoriesService.listCategories(userId);
  }

  @Post()
  @ApiOperation({ summary: "Crea una categoría personalizada" })
  @ApiOkResponse({ description: "CategoryResponseDto" })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.createCategory(userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita una categoría propia" })
  @ApiOkResponse({ description: "CategoryResponseDto" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.updateCategory(userId, id, dto);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archiva una categoría propia" })
  @ApiOkResponse({ description: "CategoryResponseDto" })
  archive(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.archiveCategory(userId, id);
  }
}
