import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from "@nestjs/swagger";
import { AppConfig } from "../config/configuration";

export class CurrenciesResponse {
  @ApiProperty({ example: "ARS" })
  default: string;

  @ApiProperty({
    type: [String],
    example: ["ARS", "USD", "EUR", "BRL", "UYU"],
  })
  supported: string[];
}

@ApiTags("reference")
@Controller("currencies")
export class ReferenceController {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  @Get()
  @ApiOperation({ summary: "Monedas soportadas" })
  @ApiOkResponse({ type: CurrenciesResponse })
  list(): CurrenciesResponse {
    return {
      default: this.config.get("defaultCurrency", { infer: true }),
      supported: this.config.get("supportedCurrencies", { infer: true }),
    };
  }
}
