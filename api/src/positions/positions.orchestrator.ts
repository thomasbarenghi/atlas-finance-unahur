import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../config/configuration";
import { Quote } from "../quotes/entities/quote.entity";
import { QuotesService } from "../quotes/quotes.service";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { AddToPositionDto } from "./dto/add-to-position.dto";
import { CreatePositionDto } from "./dto/create-position.dto";
import { PositionResponseDto } from "./dto/position-response.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { Position } from "./entities/position.entity";
import { PositionsService } from "./positions.service";

/**
 * Decorates a position with its market quote (CAL-005/006) using the quotes
 * domain. The orchestrator keeps the positions service free of quote
 * repository access and returns response DTOs.
 */
@Injectable()
export class PositionsOrchestrator {
  constructor(
    private readonly positionsService: PositionsService,
    private readonly quotesService: QuotesService,
    private readonly calculationsService: CalculationsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async listPositions(userId: string): Promise<PositionResponseDto[]> {
    const positions = await this.positionsService.listOwnedPositions(userId);
    return this.derive(positions);
  }

  async createPosition(
    userId: string,
    dto: CreatePositionDto,
  ): Promise<PositionResponseDto> {
    const position = await this.positionsService.createPosition(userId, dto);
    const [response] = await this.derive([position]);
    return response;
  }

  async updatePosition(
    userId: string,
    id: string,
    dto: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    const position = await this.positionsService.updatePosition(
      userId,
      id,
      dto,
    );
    const [response] = await this.derive([position]);
    return response;
  }

  async addToPosition(
    userId: string,
    id: string,
    dto: AddToPositionDto,
  ): Promise<PositionResponseDto> {
    const position = await this.positionsService.addToPosition(userId, id, dto);
    const [response] = await this.derive([position]);
    return response;
  }

  async archivePosition(
    userId: string,
    id: string,
  ): Promise<PositionResponseDto> {
    const position = await this.positionsService.archivePosition(userId, id);
    const [response] = await this.derive([position]);
    return response;
  }

  async restorePosition(
    userId: string,
    id: string,
  ): Promise<PositionResponseDto> {
    const position = await this.positionsService.restorePosition(userId, id);
    const [response] = await this.derive([position]);
    return response;
  }

  deletePosition(userId: string, id: string): Promise<void> {
    return this.positionsService.deletePosition(userId, id);
  }

  private async derive(positions: Position[]): Promise<PositionResponseDto[]> {
    if (positions.length === 0) return [];
    const quotes = await this.quotesService.listLatestQuoteEntities();
    const staleMs = this.config.get("market", { infer: true }).quoteStaleMs;
    const now = Date.now();

    return positions.map((position) => {
      const costBasis = position.quantity * position.avgCost;
      const quote = this.pickQuote(quotes, position.symbol, position.currency);
      if (!quote) {
        return {
          id: position.id,
          symbol: position.symbol,
          instrument: position.instrument,
          quantity: position.quantity,
          avgCost: position.avgCost,
          currency: position.currency,
          currentPrice: null,
          currentValue: null,
          costBasis,
          profitLoss: null,
          profitLossPct: null,
          quoteDate: null,
          quoteProvider: null,
          isStale: false,
          archived: position.archived,
        };
      }
      const valuation = this.calculationsService.calculatePositionValue(
        position.quantity,
        position.avgCost,
        quote.price,
      );
      return {
        id: position.id,
        symbol: position.symbol,
        instrument: position.instrument,
        quantity: position.quantity,
        avgCost: position.avgCost,
        currency: position.currency,
        currentPrice: quote.price,
        currentValue: valuation.currentValue,
        costBasis: valuation.costBasis,
        profitLoss: valuation.profitLoss,
        profitLossPct: valuation.profitLossPct,
        quoteDate: quote.fetchedAt.toISOString(),
        quoteProvider: quote.provider,
        isStale: now - quote.fetchedAt.getTime() > staleMs,
        archived: position.archived,
      };
    });
  }

  private pickQuote(
    quotes: Quote[],
    symbol: string,
    currency: string,
  ): Quote | undefined {
    return quotes
      .filter((quote) => quote.symbol === symbol && quote.currency === currency)
      .sort((a, b) => b.fetchedAt.getTime() - a.fetchedAt.getTime())[0];
  }
}
