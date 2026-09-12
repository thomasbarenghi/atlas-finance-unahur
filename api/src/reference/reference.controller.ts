import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppConfig } from "../config/configuration";

export interface CurrenciesResponse {
  default: string;
  supported: string[];
}

@ApiTags("reference")
@Controller("currencies")
export class ReferenceController {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  @Get()
  @ApiOperation({ summary: "Monedas soportadas" })
  @ApiOkResponse({ description: "{ default, supported }" })
  list(): CurrenciesResponse {
    return {
      default: this.config.get("defaultCurrency", { infer: true }),
      supported: this.config.get("supportedCurrencies", { infer: true }),
    };
  }
}
