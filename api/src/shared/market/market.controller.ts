import { Controller, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { MarketService } from "./market.service";
import { MarketRefreshResult } from "./market.types";

@ApiTags("market")
@Controller("market")
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post("refresh")
  @ApiOperation({
    summary: "Refresca cotizaciones de cripto y tipos de cambio",
  })
  @ApiOkResponse({ description: "MarketRefreshResult" })
  refresh(): Promise<MarketRefreshResult> {
    return this.marketService.refresh();
  }
}
