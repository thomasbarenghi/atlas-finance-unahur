import { ConfigService } from "@nestjs/config";
import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { AppConfig } from "../config/configuration";
import { CurrencyService } from "../shared/currency/currency.service";
import { AddToPositionDto } from "./dto/add-to-position.dto";
import { CreatePositionDto } from "./dto/create-position.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { Position } from "./entities/position.entity";

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private readonly positionsRepository: Repository<Position>,
    private readonly currency: CurrencyService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async listOwnedPositions(userId: string): Promise<Position[]> {
    return this.positionsRepository.find({
      where: { userId },
      order: { symbol: "ASC" },
    });
  }

  async listDistinctSymbols(): Promise<string[]> {
    const rows = await this.positionsRepository
      .createQueryBuilder("position")
      .select("DISTINCT position.symbol", "symbol")
      .getRawMany<{ symbol: string }>();
    return rows.map((row) => row.symbol);
  }

  async getOwnedPosition(userId: string, id: string): Promise<Position> {
    return this.findOwnedPosition(userId, id);
  }

  async createPosition(
    userId: string,
    dto: CreatePositionDto,
  ): Promise<Position> {
    return this.positionsRepository.save(
      this.positionsRepository.create({
        userId,
        symbol: this.assertSymbolSupported(dto.symbol),
        instrument: dto.instrument.trim(),
        quantity: dto.quantity,
        avgCost: dto.avgCost,
        currency: this.currency.assertSupported(dto.currency),
      }),
    );
  }

  async updatePosition(
    userId: string,
    id: string,
    dto: UpdatePositionDto,
  ): Promise<Position> {
    const position = await this.findOwnedPosition(userId, id);

    if (dto.symbol !== undefined)
      position.symbol = this.assertSymbolSupported(dto.symbol);
    if (dto.instrument !== undefined)
      position.instrument = dto.instrument.trim();
    if (dto.quantity !== undefined) position.quantity = dto.quantity;
    if (dto.avgCost !== undefined) position.avgCost = dto.avgCost;
    if (dto.currency !== undefined)
      position.currency = this.currency.assertSupported(dto.currency);

    return this.positionsRepository.save(position);
  }

  async addToPosition(
    userId: string,
    id: string,
    dto: AddToPositionDto,
  ): Promise<Position> {
    const position = await this.findOwnedPosition(userId, id);
    const addedQuantity = dto.amount / dto.unitPrice;
    const newQuantity = position.quantity + addedQuantity;
    const newAvgCost =
      newQuantity > 0
        ? (position.quantity * position.avgCost + dto.amount) / newQuantity
        : position.avgCost;

    position.quantity = newQuantity;
    position.avgCost = newAvgCost;

    return this.positionsRepository.save(position);
  }

  async archivePosition(userId: string, id: string): Promise<Position> {
    return this.setArchived(userId, id, true);
  }

  async restorePosition(userId: string, id: string): Promise<Position> {
    return this.setArchived(userId, id, false);
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

  private async setArchived(
    userId: string,
    id: string,
    archived: boolean,
  ): Promise<Position> {
    const position = await this.findOwnedPosition(userId, id);
    position.archived = archived;
    return this.positionsRepository.save(position);
  }

  private assertSymbolSupported(symbol: string): string {
    const normalized = symbol.trim().toUpperCase();
    const supported = this.config.get("market", { infer: true }).symbols;
    if (!supported.includes(normalized)) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "Ese símbolo no está en el catálogo de mercado",
        { symbol: [`Símbolos disponibles: ${supported.join(", ")}`] },
      );
    }
    return normalized;
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
