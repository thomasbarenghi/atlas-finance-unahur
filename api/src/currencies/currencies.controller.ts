import { Controller, Get } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { CurrenciesService } from "./currencies.service";
import type {
  CurrencyCatalogDto,
  CurrencySettingsDto,
} from "./dto/currency-response.dto";

@Controller("currencies")
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Public()
  @Get()
  list(): CurrencyCatalogDto[] {
    return this.currenciesService.getCatalog();
  }

  @Get("rates")
  settings(@CurrentUser("id") userId: string): Promise<CurrencySettingsDto> {
    return this.currenciesService.getSettings(userId);
  }
}
