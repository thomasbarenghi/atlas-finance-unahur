import { Controller, Get } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CategoryResponseDto } from "./dto/category-response.dto";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.listCategories();
  }
}
