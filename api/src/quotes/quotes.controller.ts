import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { QuoteResponseDto, QuotesService } from "./quotes.service";

@ApiTags("quotes")
@Controller("quotes")
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @ApiOperation({
    summary: "Catálogo de cotizaciones con bandera de antigüedad",
  })
  @ApiOkResponse({ description: "QuoteResponseDto[]" })
  list(): Promise<QuoteResponseDto[]> {
    return this.quotesService.listQuotes();
  }
}
