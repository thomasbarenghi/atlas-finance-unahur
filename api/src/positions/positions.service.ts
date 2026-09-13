import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { AppConfig } from "../config/configuration";
import { Quote } from "../quotes/entities/quote.entity";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { CreatePositionDto } from "./dto/create-position.dto";
import { AddToPositionDto } from "./dto/add-to-position.dto";
import { PositionResponseDto } from "./dto/position-response.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { Position } from "./entities/position.entity";

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private readonly positionsRepository: Repository<Position>,
    @InjectRepository(Quote)
    private readonly quotesRepository: Repository<Quote>,
    private readonly calculationsService: CalculationsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async listPositions(userId: string): Promise<PositionResponseDto[]> {
    const positions = await this.positionsRepository.find({
      where: { userId },
      order: { symbol: "ASC" },
    });
    return this.derive(positions);
  }

  async listDistinctSymbols(): Promise<string[]> {
    const rows = await this.positionsRepository
      .createQueryBuilder("position")
      .select("DISTINCT position.symbol", "symbol")
      .getRawMany<{ symbol: string }>();
    return rows.map((row) => row.symbol);
  }

  async createPosition(
    userId: string,
    dto: CreatePositionDto,
  ): Promise<PositionResponseDto> {
    const position = await this.positionsRepository.save(
      this.positionsRepository.create({
        userId,
        symbol: dto.symbol.toUpperCase(),
        instrument: dto.instrument.trim(),
        quantity: dto.quantity,
        avgCost: dto.avgCost,
        currency: dto.currency.toUpperCase(),
      }),
    );
    const [response] = await this.derive([position]);
    return response;
  }

  async updatePosition(
    userId: string,
    id: string,
    dto: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    const position = await this.findOwnedPosition(userId, id);

    if (dto.symbol !== undefined) position.symbol = dto.symbol.toUpperCase();
    if (dto.instrument !== undefined)
      position.instrument = dto.instrument.trim();
    if (dto.quantity !== undefined) position.quantity = dto.quantity;
    if (dto.avgCost !== undefined) position.avgCost = dto.avgCost;
    if (dto.currency !== undefined)
      position.currency = dto.currency.toUpperCase();

    const saved = await this.positionsRepository.save(position);
    const [response] = await this.derive([saved]);
    return response;
  }

  async addToPosition(
    userId: string,
    id: string,
    dto: AddToPositionDto,
  ): Promise<PositionResponseDto> {
    const position = await this.findOwnedPosition(userId, id);
    const addedQuantity = dto.amount / dto.unitPrice;
    const newQuantity = position.quantity + addedQuantity;
    const newAvgCost =
      newQuantity > 0
        ? (position.quantity * position.avgCost + dto.amount) / newQuantity
        : position.avgCost;

    position.quantity = newQuantity;
    position.avgCost = newAvgCost;

    const saved = await this.positionsRepository.save(position);
    const [response] = await this.derive([saved]);
    return response;
  }

  async deletePosition(userId: string, id: string): Promise<void> {
    const result = await this.positionsRepository.delete({ id, userId });
    if (!result.affected) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La posición no existe",
      );
    }
  }

  private async derive(positions: Position[]): Promise<PositionResponseDto[]> {
    if (positions.length === 0) return [];
    const quotes = await this.quotesRepository.find();
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

  private async findOwnedPosition(
    userId: string,
    id: string,
  ): Promise<Position> {
    const position = await this.positionsRepository.findOneBy({ id, userId });
    if (!position) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La posición no existe",
      );
    }
    return position;
  }
}
