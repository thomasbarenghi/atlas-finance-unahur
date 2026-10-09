import { Controller, Get } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ApiErrors } from "../common/decorators/api-errors.decorator";
import { QuoteResponseDto } from "./dto/quote-response.dto";
import { QuotesService } from "./quotes.service";

@ApiTags("quotes")
@ApiBearerAuth()
@ApiErrors(401)
@Controller("quotes")
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @ApiOperation({
    summary: "Catálogo de cotizaciones con bandera de antigüedad",
  })
  @ApiOkResponse({ type: [QuoteResponseDto] })
  list(): Promise<QuoteResponseDto[]> {
    return this.quotesService.listQuotes();
  }
}
