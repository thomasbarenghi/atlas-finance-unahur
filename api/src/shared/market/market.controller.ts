import { Controller, Post } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ApiErrors } from "../../common/decorators/api-errors.decorator";
import { MarketService } from "./market.service";
import { MarketRefreshResult } from "./market.types";

@ApiTags("market")
@ApiBearerAuth()
@ApiErrors(401, 429, 503)
@Controller("market")
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post("refresh")
  @ApiOperation({
    summary: "Refresca cotizaciones de cripto y tipos de cambio",
  })
  @ApiOkResponse({ type: MarketRefreshResult })
  refresh(): Promise<MarketRefreshResult> {
    return this.marketService.refresh();
  }
}
