import { Controller, Get } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CurrenciesService } from "./currencies.service";
import type {
  CurrencyCatalogDto,
  CurrencySettingsDto,
} from "./dto/currency-response.dto";

@Controller("currencies")
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  list(): CurrencyCatalogDto[] {
    return this.currenciesService.getCatalog();
  }

  @Get("rates")
  settings(@CurrentUser("id") userId: string): Promise<CurrencySettingsDto> {
    return this.currenciesService.getSettings(userId);
  }
}
