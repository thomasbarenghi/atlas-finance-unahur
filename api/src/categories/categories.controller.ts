import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ApiErrors } from "../common/decorators/api-errors.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CategoriesService } from "./categories.service";
import { CategoryResponseDto } from "./dto/category-response.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@ApiTags("categories")
@ApiBearerAuth()
@ApiErrors(400, 401, 404, 409)
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "Lista las categorías del usuario y del sistema" })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  list(@CurrentUser("id") userId: string): Promise<CategoryResponseDto[]> {
    return this.categoriesService.listCategories(userId);
  }

  @Post()
  @ApiOperation({ summary: "Crea una categoría personalizada" })
  @ApiOkResponse({ type: CategoryResponseDto })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.createCategory(userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita una categoría propia" })
  @ApiOkResponse({ type: CategoryResponseDto })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.updateCategory(userId, id, dto);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archiva una categoría propia" })
  @ApiOkResponse({ type: CategoryResponseDto })
  archive(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.archiveCategory(userId, id);
  }
}
